import { describe, expect, it } from 'vitest';
import { MAX_NAME_LENGTH, NAME_REQUIRED_ERROR, resolveName } from '@/lib/validateName';

describe('resolveName', () => {
  it('passes a normal name through unchanged', () => {
    expect(resolveName('Ethan Cole')).toBe('Ethan Cole');
  });

  it('trims leading and trailing whitespace', () => {
    expect(resolveName('   Ethan Cole   ')).toBe('Ethan Cole');
  });

  it('returns null for an empty string', () => {
    expect(resolveName('')).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    expect(resolveName('    ')).toBeNull();
  });

  it('truncates a 100-char input to exactly MAX_NAME_LENGTH', () => {
    const input = 'a'.repeat(100);
    const result = resolveName(input);
    expect(result).toHaveLength(MAX_NAME_LENGTH);
    expect(result).toBe('a'.repeat(MAX_NAME_LENGTH));
  });

  it('passes a name of exactly MAX_NAME_LENGTH through unchanged', () => {
    const input = 'a'.repeat(MAX_NAME_LENGTH);
    expect(resolveName(input)).toBe(input);
  });
});

describe('constants', () => {
  it('MAX_NAME_LENGTH is 40', () => {
    expect(MAX_NAME_LENGTH).toBe(40);
  });

  it('NAME_REQUIRED_ERROR is the exact error string', () => {
    expect(NAME_REQUIRED_ERROR).toBe('> ERROR: NAME REQUIRED');
  });
});
