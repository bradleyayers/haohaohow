import {
  Question,
  QuestionFlag,
  QuestionFlagType,
  QuestionType,
  SkillRating,
} from "@/data/model";
import { readonlyMapSet } from "@/util/collections";
import { Rating } from "@/util/fsrs";
import { StackNavigationFor } from "@/util/types";
import { invariant } from "@haohaohow/lib/invariant";
import {
  NavigationContainer,
  NavigationIndependentTree,
  useTheme,
} from "@react-navigation/native";
import {
  createStackNavigator,
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  TransitionPresets,
} from "@react-navigation/stack";
import { useQueries } from "@tanstack/react-query";
import { Asset } from "expo-asset";
import { Image } from "expo-image";
import { Href, Link, usePathname } from "expo-router";
import sortBy from "lodash/sortBy";
import React, { useMemo, useRef, useState } from "react";
import { Animated, Platform, View } from "react-native";
import { CloseButton } from "./CloseButton";
import { QuizDeckMultipleChoiceQuestion } from "./QuizDeckMultipleChoiceQuestion";
import { QuizDeckOneCorrectPairQuestion } from "./QuizDeckOneCorrectPairQuestion";
import { QuizProgressBar } from "./QuizProgressBar";
import { RectButton2 } from "./RectButton2";
import { useReplicache } from "./ReplicacheContext";
import { useSoundEffect } from "./useSoundEffect";
import { useEventCallback } from "./util";

interface QuestionState {
  type: QuestionStateType;
  attempts: number;
}

enum QuestionStateType {
  Correct,
  Incorrect,
}

const Stack = createStackNavigator<{
  results: undefined;
  question: {
    question: Question | null;
    flag?: QuestionFlag;
  };
}>();

type Navigation = StackNavigationFor<typeof Stack>;

export const QuizDeck = ({
  questions,
  className,
}: {
  questions: readonly Question[];
  className?: string;
}) => {
  const theme = useTheme();
  const navigationRef = useRef<Navigation>();
  const [questionStateMap, setQuestionStateMap] = useState<
    ReadonlyMap<Question, QuestionState>
  >(() => new Map());
  const r = useReplicache();

  const playSuccessSound = useSoundEffect(
    require(`@/assets/audio/sparkle.mp3`),
  );

  // The number of questions in a row correctly answered.
  const [streakCount, setStreakCount] = useState(0);

  const progress = useMemo(() => {
    let p = 0;
    for (const s of questionStateMap.values()) {
      if (s.type === QuestionStateType.Correct) {
        p += 1;
      } else if (s.attempts > 0) {
        // Give a diminishing progress for each attempt.
        p += (Math.log(s.attempts - 0.5) + 1.9) / 8.7;
      }
    }
    return p / questions.length;
  }, [questionStateMap, questions.length]);

  const handleNext = useEventCallback(() => {
    const remainingQuestions = questions
      .map((q) => [q, questionStateMap.get(q)] as const)
      .filter(([, state]) => state?.type !== QuestionStateType.Correct);
    const [next] = sortBy(remainingQuestions, ([, s]) => s?.attempts ?? 0);

    if (next != null) {
      const [question, state] = next;
      const attempts = state?.attempts ?? 0;
      const flag: QuestionFlag | undefined =
        attempts > 0
          ? { type: QuestionFlagType.PreviousMistake }
          : question.flag;
      navigationRef.current?.replace(`question`, { question, flag });
    } else {
      navigationRef.current?.replace(`results`);
    }
  });

  const handleRating = useEventCallback(
    (question: Question, ratings: SkillRating[]) => {
      invariant(
        questions.includes(question),
        `handleRating called with wrong question`,
      );
      invariant(ratings.length > 0, `ratings must not be empty`);

      const success = ratings.every(({ rating }) => rating !== Rating.Again);

      if (success) {
        playSuccessSound();
      }

      for (const { skill, rating } of ratings) {
        r.mutate
          .reviewSkill({
            now: Date.now(),
            skill,
            rating,
          })
          .catch((e: unknown) => {
            console.error(`Could not add skill review`, e);
          });
      }

      setStreakCount((prev) => (success ? prev + 1 : 0));
      setQuestionStateMap((prev) =>
        readonlyMapSet(prev, question, {
          type: success
            ? QuestionStateType.Correct
            : QuestionStateType.Incorrect,
          attempts: (prev.get(question)?.attempts ?? 0) + 1,
        }),
      );
    },
  );

  // Prefetch images used in later screens.
  usePrefetchImages(
    require(`@/assets/icons/check-circled-filled.svg`),
    require(`@/assets/icons/close-circled-filled.svg`),
  );

  const pathname = usePathname();

  return (
    <View className={className}>
      <View className="mb-[20px] w-full max-w-[600px] flex-row items-center gap-[24px] self-center px-[16px]">
        <CloseButton tintColor="#3C464D" />
        <QuizProgressBar
          progress={progress}
          colors={
            streakCount >= 2
              ? [`#E861F8`, `#414DF6`, `#75F076`] // streak
              : [`#3F4CF5`, `#3F4CF5`] // solid blue
          }
        />
      </View>

      <NavigationIndependentTree>
        <NavigationContainer theme={theme} documentTitle={{ enabled: false }}>
          <Stack.Navigator
            screenOptions={{
              gestureEnabled: false,
              headerShown: false,
              animation: `slide_from_right`,
              ...TransitionPresets.SlideFromRightIOS,
              cardStyleInterpolator: horizontalCardStyleInterpolator,
            }}
            screenListeners={({ navigation }) => ({
              // Hack to get the navigation object.
              state: () => {
                navigationRef.current = navigation;
                // as Navigation;
              },
            })}
          >
            <Stack.Screen
              name="question"
              initialParams={{
                // initial params is cached across multiple mounts, it seems like
                // the screen names are global? and initialParams can only be set
                // once?
                question: null,
              }}
              children={({
                route: {
                  params: { question: q, flag: f },
                },
              }) => {
                const question = q ?? questions[0];
                const flag = f ?? question?.flag;

                invariant(
                  question != null && questions.includes(question),
                  `Stack.Screen called with wrong question`,
                );

                let screen: React.ReactNode;

                switch (question.type) {
                  case QuestionType.MultipleChoice:
                    screen = (
                      <QuizDeckMultipleChoiceQuestion
                        question={question}
                        onNext={handleNext}
                        onRating={handleRating}
                      />
                    );
                    break;
                  case QuestionType.OneCorrectPair:
                    screen = (
                      <QuizDeckOneCorrectPairQuestion
                        question={question}
                        flag={flag}
                        onNext={handleNext}
                        onRating={handleRating}
                      />
                    );
                }

                return (
                  <View className="h-full w-full max-w-[600px] flex-1 self-center">
                    {screen}
                  </View>
                );
              }}
            />
            <Stack.Screen
              name="results"
              children={() => {
                return (
                  <View className="gap-2">
                    <Link href={pathname as Href} asChild replace>
                      <RectButton2 variant="filled" accent>
                        Keep learning
                      </RectButton2>
                    </Link>
                    <Link href="/learn" asChild>
                      <RectButton2 variant="bare">
                        That’s enough for now
                      </RectButton2>
                    </Link>
                  </View>
                );
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </View>
  );
};

function horizontalCardStyleInterpolator({
  current,
  next,
  inverted,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const distance =
    screen.width >= 768
      ? 40 // on big screens sliding the whole screen across is too distracting, so instead we just do a small slide
      : screen.width;

  const translateEntering = Animated.multiply(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [distance, 0],
    }),
    inverted,
  );

  const translateExiting = next
    ? Animated.multiply(
        next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -distance],
        }),
        inverted,
      )
    : translateEntering;

  const opacity = next
    ? Animated.subtract(1, next.progress)
    : Animated.add(0, current.progress);

  return {
    cardStyle: {
      transform: [{ translateX: translateExiting }],
      opacity,
    },
  };
}

function usePrefetchImages(...images: (string | number)[]) {
  return useQueries({
    queries: images.map((image) => ({
      queryKey: [usePrefetchImages.name, image],
      queryFn: () => cacheImage(image),
    })),
  });
}

function cacheImage(image: string | number) {
  if (Platform.OS === `web`) {
    const uri = typeof image === `string` ? image : Asset.fromModule(image).uri;
    return Image.prefetch(uri);
  }
  return Asset.fromModule(image).downloadAsync();
}
