import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { Platform } from "react-native";
import { effectWebEventListener } from "./hooks";

// SecureStore keys must contain only alphanumeric characters, ".", "-", and
// "_", so the separator is `.`
const QUERY_KEY_PREFIX = `hhh.`;

/**
 *
 * @param storageKey Using the prefixed key ("storageKey") as the query key (as
 * opposed to the unprefixed key) makes it simpler to synchronise
 * @returns
 */
function getQueryKey(storageKey: string): readonly string[] {
  return [`clientStorage`, storageKey];
}

function getStorageKey(key: string): string {
  return `${QUERY_KEY_PREFIX}${key}`;
}

/**
 * react-query wrapper around localStorage (web) and SecureStore (ios +
 * android). See @see {useClientStorageMutation}.
 */
export const useClientStorageQuery = (key: string) => {
  const queryClient = useQueryClient();
  const storageKey = getStorageKey(key);
  const queryKey = getQueryKey(storageKey);

  // Synchronise localStorage changes from other browser tabs.
  useEffect(
    () =>
      effectWebEventListener(`storage`, (event) => {
        if (event.storageArea === localStorage && event.key === storageKey) {
          queryClient.setQueryData(queryKey, event.newValue);
        }
      }),
    [key, queryClient, storageKey, queryKey],
  );

  return useQuery({
    queryKey,
    queryFn: async () => {
      switch (Platform.OS) {
        case `web`: {
          return localStorage.getItem(storageKey);
        }
        case `ios`:
        case `android`:
          return SecureStore.getItemAsync(storageKey);
        default:
          throw new Error(`unsupported platform ${Platform.OS}`);
      }
    },
  });
};

/**
 * Set a value (string), or null to delete the item.
 */
export const useClientStorageMutation = (key: string) => {
  const queryClient = useQueryClient();
  const storageKey = getStorageKey(key);

  return useMutation({
    mutationFn: async (value: string | null) => {
      switch (Platform.OS) {
        case `web`: {
          if (value === null) {
            localStorage.removeItem(storageKey);
          } else {
            localStorage.setItem(storageKey, value);
          }
          break;
        }
        case `ios`:
        case `android`:
          if (value === null) {
            await SecureStore.deleteItemAsync(storageKey);
          } else {
            await SecureStore.setItemAsync(storageKey, value);
          }
          break;
        default:
          throw new Error(`unsupported platform ${Platform.OS}`);
      }

      // Passes through to `onSuccess`.
      return value;
    },
    onSuccess: async (data) => {
      const queryKey = getQueryKey(storageKey);

      if (data === null) {
        await queryClient.invalidateQueries({
          queryKey,
        });
      } else {
        queryClient.setQueryData(queryKey, data);
      }
    },
  });
};
