import { Platform } from "react-native";

let AsyncStorage: any;
if (Platform.OS !== "web") {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
}

type Callback<T> = (error?: Error | null, result?: T) => void;
type KeyValuePair = readonly [string, string | null];
type MultiCallback = (errors?: Error[] | null) => void;

const createWebStorage = () => {
  const isServer = typeof window === "undefined";

  return {
    getItem: (key: string, callback?: Callback<string | null>) => {
      return new Promise<string | null>((resolve) => {
        const result = isServer ? null : localStorage.getItem(key);
        if (callback) callback(null, result);
        resolve(result);
      });
    },

    setItem: (key: string, value: string, callback?: Callback<void>) => {
      return new Promise<void>((resolve) => {
        if (!isServer) {
          localStorage.setItem(key, value);
        }
        if (callback) callback(null);
        resolve();
      });
    },

    removeItem: (key: string, callback?: Callback<void>) => {
      return new Promise<void>((resolve) => {
        if (!isServer) {
          localStorage.removeItem(key);
        }
        if (callback) callback(null);
        resolve();
      });
    },

    multiGet: (
      keys: readonly string[],
      callback?: Callback<readonly KeyValuePair[]>
    ) => {
      return new Promise<readonly KeyValuePair[]>((resolve) => {
        const result: KeyValuePair[] = isServer
          ? keys.map((key) => [key, null] as const)
          : keys.map((key) => [key, localStorage.getItem(key)] as const);

        if (callback) callback(null, result);
        resolve(result);
      });
    },

    multiSet: (
      keyValuePairs: readonly (readonly [string, string])[],
      callback?: MultiCallback
    ) => {
      return new Promise<void>((resolve) => {
        if (!isServer) {
          keyValuePairs.forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });
        }
        if (callback) callback();
        resolve();
      });
    },

    multiRemove: (keys: readonly string[], callback?: MultiCallback) => {
      return new Promise<void>((resolve) => {
        if (!isServer) {
          keys.forEach((key) => {
            localStorage.removeItem(key);
          });
        }
        if (callback) callback();
        resolve();
      });
    },

    multiMerge: (
      keyValuePairs: readonly (readonly [string, string])[],
      callback?: MultiCallback
    ) => {
      return new Promise<void>((resolve) => {
        if (!isServer) {
          keyValuePairs.forEach(([key, value]) => {
            const existingValue = localStorage.getItem(key);
            if (existingValue) {
              try {
                const existingObj = JSON.parse(existingValue);
                const newObj = JSON.parse(value);
                const mergedObj = { ...existingObj, ...newObj };
                localStorage.setItem(key, JSON.stringify(mergedObj));
              } catch {
                localStorage.setItem(key, value);
              }
            } else {
              localStorage.setItem(key, value);
            }
          });
        }
        if (callback) callback();
        resolve();
      });
    },

    mergeItem: (key: string, value: string, callback?: Callback<void>) => {
      return new Promise<void>((resolve) => {
        if (!isServer) {
          const existingValue = localStorage.getItem(key);
          if (existingValue) {
            try {
              const existingObj = JSON.parse(existingValue);
              const newObj = JSON.parse(value);
              const mergedObj = { ...existingObj, ...newObj };
              localStorage.setItem(key, JSON.stringify(mergedObj));
            } catch {
              localStorage.setItem(key, value);
            }
          } else {
            localStorage.setItem(key, value);
          }
        }
        if (callback) callback(null);
        resolve();
      });
    },

    getAllKeys: (callback?: Callback<readonly string[]>) => {
      return new Promise<readonly string[]>((resolve) => {
        const keys: string[] = [];
        if (!isServer) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) keys.push(key);
          }
        }
        if (callback) callback(null, keys);
        resolve(keys);
      });
    },

    flushGetRequests: () => {},

    clear: (callback?: Callback<void>) => {
      return new Promise<void>((resolve) => {
        if (!isServer) {
          localStorage.clear();
        }
        if (callback) callback(null);
        resolve();
      });
    },
  };
};

export const Storage =
  Platform.OS === "web" ? (createWebStorage() as any) : AsyncStorage;

export default Storage;
