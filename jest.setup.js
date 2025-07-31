// Mock React Native Animated pour éviter les erreurs
global.__reanimatedWorkletInit = jest.fn();

// Mock Expo modules that cause issues
global.__ExpoImportMetaRegistry = jest.fn();

// Suppress console warnings during tests  
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

global.console = {
  ...console,
  warn: jest.fn((...args) => {
    if (args[0]?.includes?.('Clipboard') || args[0]?.includes?.('ProgressBarAndroid')) {
      return;
    }
    originalWarn(...args);
  }),
  error: jest.fn((...args) => {
    if (args[0]?.includes?.('TurboModuleRegistry')) {
      return;
    }
    originalError(...args);
  }),
  log: originalLog,
};

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => '/',
  Link: ({ children }) => children,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'http://localhost:54321',
      supabaseAnonKey: 'test-anon-key',
    },
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: jest.fn(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
  })),
}));

// Mock Legend State
jest.mock('@legendapp/state', () => ({
  observable: jest.fn((initialValue) => ({
    get: jest.fn(() => initialValue),
    set: jest.fn(),
    onChange: jest.fn(),
    peek: jest.fn(() => initialValue),
  })),
  observe: jest.fn((fn) => fn()),
  when: jest.fn(),
  computed: jest.fn((fn) => fn()),
  batch: jest.fn((fn) => fn()),
  enableLegendStateReact: jest.fn(),
  persistObservable: jest.fn(),
  configureObservableSync: jest.fn(),
  syncObservable: jest.fn(),
  synced: jest.fn(),
}));

// Mock Alert separately
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Global test utilities
global.mockSupabaseAuth = (user = null, session = null) => {
  const supabase = require('@supabase/supabase-js').createClient();
  supabase.auth.getSession.mockResolvedValue({
    data: { session },
    error: null,
  });
  return supabase;
};

// Mock Expo modules that might be missing
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(),
    fromModule: jest.fn(() => ({ uri: 'test-uri' })),
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `myapp://${path}`),
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openSettings: jest.fn(),
}));

// Ces fonctions sont déjà mockées plus haut, on n'a pas besoin de les redéfinir