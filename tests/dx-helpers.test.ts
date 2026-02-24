import { describe, expect, it } from 'vitest';
import * as SnapArgs from '../src/dx/args/index.js';

describe('SnapArgs DX helpers', () => {
  describe('readStringArg', () => {
    it('reads string from args', () => {
      const args = { name: 'Alice' };
      const result = SnapArgs.readStringArg(args, 'name');
      expect(result).toBe('Alice');
    });

    it('tries multiple keys in order', () => {
      const args = { username: 'Bob' };
      const result = SnapArgs.readStringArg(args, 'name', 'username', 'user');
      expect(result).toBe('Bob');
    });

    it('returns undefined when no keys match', () => {
      const args = { age: '25' };
      const result = SnapArgs.readStringArg(args, 'name');
      expect(result).toBeUndefined();
    });

    it('trims whitespace', () => {
      const args = { name: '  Alice  ' };
      const result = SnapArgs.readStringArg(args, 'name');
      expect(result).toBe('Alice');
    });

    it('returns undefined for empty string after trim', () => {
      const args = { name: '   ' };
      const result = SnapArgs.readStringArg(args, 'name');
      expect(result).toBeUndefined();
    });
  });

  describe('readRequiredStringArg', () => {
    it('returns string when present', () => {
      const args = { name: 'Alice' };
      const result = SnapArgs.readRequiredStringArg(args, 'name');
      expect(result).toBe('Alice');
    });

    it('throws error when missing', () => {
      const args = {};
      expect(() => {
        SnapArgs.readRequiredStringArg(args, 'name');
      }).toThrow('Missing required arg: name');
    });

    it('uses custom error message', () => {
      const args = {};
      expect(() => {
        SnapArgs.readRequiredStringArg(args, 'name', 'Name is required');
      }).toThrow('Name is required');
    });
  });

  describe('parseBooleanLike', () => {
    it('parses true values', () => {
      expect(SnapArgs.parseBooleanLike('1')).toBe(true);
      expect(SnapArgs.parseBooleanLike('true')).toBe(true);
      expect(SnapArgs.parseBooleanLike('yes')).toBe(true);
      expect(SnapArgs.parseBooleanLike('y')).toBe(true);
      expect(SnapArgs.parseBooleanLike('on')).toBe(true);
    });

    it('parses false values', () => {
      expect(SnapArgs.parseBooleanLike('0')).toBe(false);
      expect(SnapArgs.parseBooleanLike('false')).toBe(false);
      expect(SnapArgs.parseBooleanLike('no')).toBe(false);
      expect(SnapArgs.parseBooleanLike('n')).toBe(false);
      expect(SnapArgs.parseBooleanLike('off')).toBe(false);
    });

    it('returns undefined for undefined', () => {
      expect(SnapArgs.parseBooleanLike(undefined)).toBeUndefined();
    });

    it('returns boolean for boolean', () => {
      expect(SnapArgs.parseBooleanLike(true)).toBe(true);
      expect(SnapArgs.parseBooleanLike(false)).toBe(false);
    });

    it('throws error for invalid value', () => {
      expect(() => {
        SnapArgs.parseBooleanLike('invalid');
      }).toThrow('Invalid boolean value "invalid".');
    });

    it('is case insensitive', () => {
      expect(SnapArgs.parseBooleanLike('TRUE')).toBe(true);
      expect(SnapArgs.parseBooleanLike('False')).toBe(false);
      expect(SnapArgs.parseBooleanLike('YES')).toBe(true);
    });
  });

  describe('readBooleanArg', () => {
    it('reads boolean from args', () => {
      const args = { verbose: 'true' };
      const result = SnapArgs.readBooleanArg(args, 'verbose');
      expect(result).toBe(true);
    });

    it('tries multiple keys in order', () => {
      const args = { v: 'true' };
      const result = SnapArgs.readBooleanArg(args, 'verbose', 'v');
      expect(result).toBe(true);
    });

    it('returns undefined when no keys match', () => {
      const args = { debug: 'true' };
      const result = SnapArgs.readBooleanArg(args, 'verbose');
      expect(result).toBeUndefined();
    });

    it('parses various boolean representations', () => {
      const args1 = { flag: 'yes' };
      expect(SnapArgs.readBooleanArg(args1, 'flag')).toBe(true);

      const args2 = { flag: '0' };
      expect(SnapArgs.readBooleanArg(args2, 'flag')).toBe(false);
    });
  });

  describe('collectUpperSnakeCaseEnvArgs', () => {
    it('collects all upper snake case env args', () => {
      const args = {
        MYAPP_API_KEY: 'secret',
        MYAPP_TIMEOUT: '5000',
        OTHER_VAR: 'value',
        lower_case_key: 'should be filtered'
      };
      const result = SnapArgs.collectUpperSnakeCaseEnvArgs({ args });
      expect(result).toEqual({
        MYAPP_API_KEY: 'secret',
        MYAPP_TIMEOUT: '5000',
        OTHER_VAR: 'value'
      });
    });

    it('filters out non-upper-snake-case keys', () => {
      const args = {
        lower_case_key: 'should be filtered',
        MixedCase: 'should be filtered',
        MYAPP_API_KEY: 'secret'
      };
      const result = SnapArgs.collectUpperSnakeCaseEnvArgs({ args });
      expect(result).toEqual({
        MYAPP_API_KEY: 'secret'
      });
    });

    it('handles empty args', () => {
      const args = {};
      const result = SnapArgs.collectUpperSnakeCaseEnvArgs({ args });
      expect(result).toEqual({});
    });

    it('filters out reserved keys', () => {
      const args = {
        MYAPP_API_KEY: 'secret',
        MYAPP_TIMEOUT: '5000',
        MYAPP_RESERVED: 'should be filtered'
      };
      const result = SnapArgs.collectUpperSnakeCaseEnvArgs({
        args,
        reservedKeys: ['MYAPP_RESERVED']
      });
      expect(result).toEqual({
        MYAPP_API_KEY: 'secret',
        MYAPP_TIMEOUT: '5000'
      });
    });
  });

  describe('isUpperSnakeCaseKey', () => {
    it('returns true for valid upper snake case', () => {
      expect(SnapArgs.isUpperSnakeCaseKey('MY_VAR')).toBe(true);
      expect(SnapArgs.isUpperSnakeCaseKey('API_KEY')).toBe(true);
      expect(SnapArgs.isUpperSnakeCaseKey('MY_APP_V2_API')).toBe(true);
    });

    it('returns false for invalid patterns', () => {
      expect(SnapArgs.isUpperSnakeCaseKey('my_var')).toBe(false);
      expect(SnapArgs.isUpperSnakeCaseKey('MyVar')).toBe(false);
      expect(SnapArgs.isUpperSnakeCaseKey('MY-VAR')).toBe(false);
      expect(SnapArgs.isUpperSnakeCaseKey('MY VAR')).toBe(false);
      expect(SnapArgs.isUpperSnakeCaseKey('')).toBe(false);
    });
  });
});
