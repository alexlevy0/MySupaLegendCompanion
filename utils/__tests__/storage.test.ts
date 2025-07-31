import { Platform } from 'react-native';

// Mock AsyncStorage before importing storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    getAllKeys: jest.fn(),
    clear: jest.fn(),
  },
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('storage', () => {
  let storage: any;
  let mockAsyncStorage: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('Native Platform (iOS/Android)', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
      storage = require('../storage').default;
      mockAsyncStorage = require('@react-native-async-storage/async-storage').default;
    });

    describe('getItem', () => {
      it('should get item from AsyncStorage', async () => {
        const key = 'testKey';
        const value = 'testValue';
        mockAsyncStorage.getItem.mockResolvedValue(value);

        const result = await storage.getItem(key);

        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(key);
        expect(result).toBe(value);
      });

      it('should handle null values', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);

        const result = await storage.getItem('nonexistent');

        expect(result).toBeNull();
      });

      it('should handle callback style', (done) => {
        const value = 'callbackValue';
        mockAsyncStorage.getItem.mockImplementation((key, callback) => {
          if (callback) callback(null, value);
          return Promise.resolve(value);
        });

        storage.getItem('key', (error: any, result: any) => {
          expect(error).toBeNull();
          expect(result).toBe(value);
          done();
        });
      });
    });

    describe('setItem', () => {
      it('should set item in AsyncStorage', async () => {
        const key = 'testKey';
        const value = 'testValue';
        mockAsyncStorage.setItem.mockResolvedValue(undefined);

        await storage.setItem(key, value);

        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(key, value);
      });

      it('should handle callback style', (done) => {
        mockAsyncStorage.setItem.mockImplementation((key, value, callback) => {
          if (callback) callback(null);
          return Promise.resolve();
        });

        storage.setItem('key', 'value', (error: any) => {
          expect(error).toBeNull();
          done();
        });
      });
    });

    describe('removeItem', () => {
      it('should remove item from AsyncStorage', async () => {
        const key = 'testKey';
        mockAsyncStorage.removeItem.mockResolvedValue(undefined);

        await storage.removeItem(key);

        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(key);
      });
    });

    describe('multiGet', () => {
      it('should get multiple items', async () => {
        const keys = ['key1', 'key2', 'key3'];
        const values = [
          ['key1', 'value1'],
          ['key2', 'value2'],
          ['key3', null],
        ];
        mockAsyncStorage.multiGet.mockResolvedValue(values);

        const result = await storage.multiGet(keys);

        expect(mockAsyncStorage.multiGet).toHaveBeenCalledWith(keys);
        expect(result).toEqual(values);
      });
    });

    describe('multiSet', () => {
      it('should set multiple items', async () => {
        const pairs = [
          ['key1', 'value1'],
          ['key2', 'value2'],
        ];
        mockAsyncStorage.multiSet.mockResolvedValue(undefined);

        await storage.multiSet(pairs);

        expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith(pairs);
      });
    });

    describe('multiRemove', () => {
      it('should remove multiple items', async () => {
        const keys = ['key1', 'key2'];
        mockAsyncStorage.multiRemove.mockResolvedValue(undefined);

        await storage.multiRemove(keys);

        expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(keys);
      });
    });

    describe('getAllKeys', () => {
      it('should get all keys', async () => {
        const keys = ['key1', 'key2', 'key3'];
        mockAsyncStorage.getAllKeys.mockResolvedValue(keys);

        const result = await storage.getAllKeys();

        expect(mockAsyncStorage.getAllKeys).toHaveBeenCalled();
        expect(result).toEqual(keys);
      });
    });

    describe('clear', () => {
      it('should clear all storage', async () => {
        mockAsyncStorage.clear.mockResolvedValue(undefined);

        await storage.clear();

        expect(mockAsyncStorage.clear).toHaveBeenCalled();
      });
    });
  });

  describe('Web Platform', () => {
    let mockLocalStorage: { [key: string]: string };

    beforeEach(() => {
      mockLocalStorage = {};
      (Platform as any).OS = 'web';
      
      // Mock localStorage
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn((key) => mockLocalStorage[key] || null),
          setItem: jest.fn((key, value) => {
            mockLocalStorage[key] = value;
          }),
          removeItem: jest.fn((key) => {
            delete mockLocalStorage[key];
          }),
          clear: jest.fn(() => {
            mockLocalStorage = {};
          }),
        },
        writable: true,
      });

      storage = require('../storage').default;
    });

    afterEach(() => {
      delete (global as any).localStorage;
    });

    describe('getItem', () => {
      it('should get item from localStorage', async () => {
        mockLocalStorage['testKey'] = 'testValue';

        const result = await storage.getItem('testKey');

        expect(global.localStorage.getItem).toHaveBeenCalledWith('testKey');
        expect(result).toBe('testValue');
      });

      it('should return null for non-existent keys', async () => {
        const result = await storage.getItem('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('setItem', () => {
      it('should set item in localStorage', async () => {
        await storage.setItem('testKey', 'testValue');

        expect(global.localStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
        expect(mockLocalStorage['testKey']).toBe('testValue');
      });
    });

    describe('removeItem', () => {
      it('should remove item from localStorage', async () => {
        mockLocalStorage['testKey'] = 'testValue';

        await storage.removeItem('testKey');

        expect(global.localStorage.removeItem).toHaveBeenCalledWith('testKey');
        expect(mockLocalStorage['testKey']).toBeUndefined();
      });
    });

    describe('multiGet', () => {
      it('should get multiple items from localStorage', async () => {
        mockLocalStorage['key1'] = 'value1';
        mockLocalStorage['key2'] = 'value2';

        const result = await storage.multiGet(['key1', 'key2', 'key3']);

        expect(result).toEqual([
          ['key1', 'value1'],
          ['key2', 'value2'],
          ['key3', null],
        ]);
      });
    });

    describe('multiSet', () => {
      it('should set multiple items in localStorage', async () => {
        const pairs = [
          ['key1', 'value1'],
          ['key2', 'value2'],
        ];

        await storage.multiSet(pairs);

        expect(mockLocalStorage['key1']).toBe('value1');
        expect(mockLocalStorage['key2']).toBe('value2');
      });

      it('should skip null values', async () => {
        const pairs = [
          ['key1', 'value1'],
          ['key2', null],
        ];

        await storage.multiSet(pairs);

        expect(mockLocalStorage['key1']).toBe('value1');
        expect(mockLocalStorage['key2']).toBeUndefined();
      });
    });

    describe('multiRemove', () => {
      it('should remove multiple items from localStorage', async () => {
        mockLocalStorage['key1'] = 'value1';
        mockLocalStorage['key2'] = 'value2';
        mockLocalStorage['key3'] = 'value3';

        await storage.multiRemove(['key1', 'key2']);

        expect(mockLocalStorage['key1']).toBeUndefined();
        expect(mockLocalStorage['key2']).toBeUndefined();
        expect(mockLocalStorage['key3']).toBe('value3');
      });
    });

    describe('getAllKeys', () => {
      it('should get all keys from localStorage', async () => {
        mockLocalStorage['key1'] = 'value1';
        mockLocalStorage['key2'] = 'value2';
        mockLocalStorage['key3'] = 'value3';

        Object.defineProperty(global.localStorage, 'length', {
          value: 3,
          writable: true,
        });
        
        (global.localStorage as any).key = jest.fn((index) => {
          const keys = Object.keys(mockLocalStorage);
          return keys[index] || null;
        });

        const result = await storage.getAllKeys();

        expect(result).toEqual(['key1', 'key2', 'key3']);
      });
    });

    describe('clear', () => {
      it('should clear all localStorage', async () => {
        mockLocalStorage['key1'] = 'value1';
        mockLocalStorage['key2'] = 'value2';

        await storage.clear();

        expect(global.localStorage.clear).toHaveBeenCalled();
      });
    });
  });

  describe('Server-Side Rendering', () => {
    beforeEach(() => {
      (Platform as any).OS = 'web';
      // Remove window to simulate server environment
      delete (global as any).window;
      storage = require('../storage').default;
    });

    afterEach(() => {
      (global as any).window = {};
    });

    it('should handle getItem on server', async () => {
      const result = await storage.getItem('anyKey');
      expect(result).toBeNull();
    });

    it('should handle setItem on server', async () => {
      await expect(storage.setItem('key', 'value')).resolves.toBeUndefined();
    });

    it('should handle multiGet on server', async () => {
      const result = await storage.multiGet(['key1', 'key2']);
      expect(result).toEqual([
        ['key1', null],
        ['key2', null],
      ]);
    });

    it('should handle getAllKeys on server', async () => {
      const result = await storage.getAllKeys();
      expect(result).toEqual([]);
    });
  });
});