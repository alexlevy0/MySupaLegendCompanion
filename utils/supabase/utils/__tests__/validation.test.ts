import { validateFrenchPhone } from '../validation';

describe('validateFrenchPhone', () => {
  describe('Valid phone numbers', () => {
    it('should validate standard French mobile numbers', () => {
      const testCases = [
        '0612345678',
        '0712345678',
        '0612345678',
        '0756789012',
      ];

      testCases.forEach(phone => {
        const result = validateFrenchPhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.cleaned).toBe(phone);
        expect(result.error).toBeUndefined();
      });
    });

    it('should validate French landline numbers', () => {
      const testCases = [
        '0123456789',
        '0234567890',
        '0345678901',
        '0456789012',
        '0567890123',
      ];

      testCases.forEach(phone => {
        const result = validateFrenchPhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.cleaned).toBe(phone);
        expect(result.error).toBeUndefined();
      });
    });

    it('should handle numbers with spaces', () => {
      const testCases = [
        { input: '06 12 34 56 78', expected: '0612345678' },
        { input: '01 23 45 67 89', expected: '0123456789' },
        { input: '06  12  34  56  78', expected: '0612345678' }, // Multiple spaces
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateFrenchPhone(input);
        expect(result.isValid).toBe(true);
        expect(result.cleaned).toBe(expected);
      });
    });

    it('should handle numbers with dots', () => {
      const testCases = [
        { input: '06.12.34.56.78', expected: '0612345678' },
        { input: '01.23.45.67.89', expected: '0123456789' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateFrenchPhone(input);
        expect(result.isValid).toBe(true);
        expect(result.cleaned).toBe(expected);
      });
    });

    it('should handle numbers with dashes', () => {
      const testCases = [
        { input: '06-12-34-56-78', expected: '0612345678' },
        { input: '01-23-45-67-89', expected: '0123456789' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateFrenchPhone(input);
        expect(result.isValid).toBe(true);
        expect(result.cleaned).toBe(expected);
      });
    });

    it('should handle numbers with parentheses', () => {
      const testCases = [
        { input: '(06)12345678', expected: '0612345678' },
        { input: '(01)23456789', expected: '0123456789' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateFrenchPhone(input);
        expect(result.isValid).toBe(true);
        expect(result.cleaned).toBe(expected);
      });
    });

    it('should handle numbers with mixed separators', () => {
      const testCases = [
        { input: '06 12.34-56(78)', expected: '0612345678' },
        { input: '01-23 45.67 89', expected: '0123456789' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateFrenchPhone(input);
        expect(result.isValid).toBe(true);
        expect(result.cleaned).toBe(expected);
      });
    });

    it('should handle international format with +33', () => {
      const testCases = [
        { input: '+33612345678', expected: '0612345678' },
        { input: '+33123456789', expected: '0123456789' },
        { input: '+33 6 12 34 56 78', expected: '0612345678' },
        { input: '+33-6-12-34-56-78', expected: '0612345678' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateFrenchPhone(input);
        expect(result.isValid).toBe(true);
        expect(result.cleaned).toBe(expected);
      });
    });

    it('should handle international format with 0033', () => {
      const testCases = [
        { input: '0033612345678', expected: '0612345678' },
        { input: '0033123456789', expected: '0123456789' },
        { input: '0033 6 12 34 56 78', expected: '0612345678' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateFrenchPhone(input);
        expect(result.isValid).toBe(true);
        expect(result.cleaned).toBe(expected);
      });
    });
  });

  describe('Invalid phone numbers', () => {
    it('should reject numbers that are too short', () => {
      const testCases = ['06123456', '0612345', '061234', '06'];

      testCases.forEach(phone => {
        const result = validateFrenchPhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.cleaned).toBe('');
        expect(result.error).toBe('Le numéro doit être un téléphone français valide (ex: 06 12 34 56 78)');
      });
    });

    it('should reject numbers that are too long', () => {
      const testCases = ['061234567890', '06123456789012', '061234567890123456'];

      testCases.forEach(phone => {
        const result = validateFrenchPhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.cleaned).toBe('');
        expect(result.error).toBe('Le numéro doit être un téléphone français valide (ex: 06 12 34 56 78)');
      });
    });

    it('should reject numbers starting with invalid prefix', () => {
      const testCases = [
        '0012345678', // Invalid prefix
        '1234567890', // Missing 0
        '9612345678', // Invalid first digit
      ];

      testCases.forEach(phone => {
        const result = validateFrenchPhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.cleaned).toBe('');
        expect(result.error).toBe('Le numéro doit être un téléphone français valide (ex: 06 12 34 56 78)');
      });
    });

    it('should reject numbers with letters', () => {
      const testCases = [
        '06abc45678',
        'abcdefghij',
        '06-CALL-NOW',
      ];

      testCases.forEach(phone => {
        const result = validateFrenchPhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.cleaned).toBe('');
        expect(result.error).toBe('Le numéro doit être un téléphone français valide (ex: 06 12 34 56 78)');
      });
    });

    it('should reject empty or null values', () => {
      const testCases = ['', '   ', '\t\n'];

      testCases.forEach(phone => {
        const result = validateFrenchPhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.cleaned).toBe('');
        expect(result.error).toBe('Le numéro doit être un téléphone français valide (ex: 06 12 34 56 78)');
      });
    });

    it('should reject international numbers from other countries', () => {
      const testCases = [
        '+44123456789', // UK
        '+1234567890',  // US
        '+49123456789', // Germany
      ];

      testCases.forEach(phone => {
        const result = validateFrenchPhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.cleaned).toBe('');
        expect(result.error).toBe('Le numéro doit être un téléphone français valide (ex: 06 12 34 56 78)');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters gracefully', () => {
      const testCases = [
        '06@12#34$56%78',
        '06!12?34*56&78',
      ];

      testCases.forEach(phone => {
        const result = validateFrenchPhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.cleaned).toBe('');
        expect(result.error).toBe('Le numéro doit être un téléphone français valide (ex: 06 12 34 56 78)');
      });
    });

    it('should handle very long input without crashing', () => {
      const longInput = '0'.repeat(1000);
      const result = validateFrenchPhone(longInput);
      expect(result.isValid).toBe(false);
      expect(result.cleaned).toBe('');
    });

    it('should handle unusual but valid formats', () => {
      // All special services numbers (08xx)
      const result = validateFrenchPhone('0812345678');
      expect(result.isValid).toBe(true);
      expect(result.cleaned).toBe('0812345678');
    });

    it('should handle exception gracefully', () => {
      // Test with an object that would throw when replace is called
      const invalidInput = { toString: () => { throw new Error('Test error'); } } as any;
      
      // Mock console.error to avoid error output in tests
      const originalError = console.error;
      console.error = jest.fn();
      
      const result = validateFrenchPhone(invalidInput);
      
      expect(result.isValid).toBe(false);
      expect(result.cleaned).toBe('');
      expect(result.error).toBe('Format de téléphone invalide');
      
      console.error = originalError;
    });
  });

  describe('Normalization', () => {
    it('should normalize all valid formats to standard format', () => {
      const testCases = [
        { input: '+33612345678', expected: '0612345678' },
        { input: '0033612345678', expected: '0612345678' },
        { input: '06 12 34 56 78', expected: '0612345678' },
        { input: '06.12.34.56.78', expected: '0612345678' },
        { input: '06-12-34-56-78', expected: '0612345678' },
        { input: '+33 6 12 34 56 78', expected: '0612345678' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateFrenchPhone(input);
        expect(result.isValid).toBe(true);
        expect(result.cleaned).toBe(expected);
      });
    });
  });
});