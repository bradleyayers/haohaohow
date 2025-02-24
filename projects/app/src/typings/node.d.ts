declare global {
  interface NodeRequire {
    // Support for asset files. Anything that starts with a dot and ends with a
    // known extension.
    (id: `${string}.${`ttf` | `otf` | `svg` | `png` | `json`}`): string;
    (id: `${string}.mp3`): import("expo-av").AVPlaybackSource;
  }

  namespace NodeJS {
    // Necessary to avoid noPropertyAccessFromIndexSignature errors. Keep in
    // sync with `env.ts`.
    interface ProcessEnv {
      EXPO_PUBLIC_REPLICACHE_LICENSE_KEY?: string;
      EXPO_PUBLIC_REVENUECAT_APPLE_KEY?: string;
      EXPO_PUBLIC_REVENUECAT_WEB_KEY?: string;
      EXPO_PUBLIC_SENTRY_DSN?: string;
      EXPO_PUBLIC_USE_STATIC?: string | boolean; // boolean during static render, string on web
      HHH_PREFLIGHT_CHECK_ENV_VARS?: string;
      NODE_ENV?: string;
      POSTMARK_SERVER_TOKEN?: string;
    }
  }
}

export {};
