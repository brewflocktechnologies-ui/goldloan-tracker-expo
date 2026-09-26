import { getAvatarColor, getInitials } from '../../../src/components/users/userAvatar';

describe('getInitials', () => {
  it('uses the first letters of the first two words, upper-cased', () => {
    expect(getInitials('ravi kumar')).toBe('RK');
    expect(getInitials('Anita Devi Sharma')).toBe('AD');
  });

  it('handles a single name', () => {
    expect(getInitials('Zoya')).toBe('Z');
  });

  it('falls back to "U" for empty or missing names', () => {
    expect(getInitials('')).toBe('U');
    expect(getInitials(undefined)).toBe('U');
  });
});

describe('getAvatarColor', () => {
  it('returns a bg/text pair', () => {
    const tone = getAvatarColor('Ravi Kumar');
    expect(tone.bg).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tone.text).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('is stable for the same name', () => {
    expect(getAvatarColor('Ravi Kumar')).toEqual(getAvatarColor('Ravi Kumar'));
  });

  it('does not throw for empty names', () => {
    expect(() => getAvatarColor('')).not.toThrow();
    expect(() => getAvatarColor(undefined as unknown as string)).not.toThrow();
  });

  it('spreads different names across more than one colour', () => {
    const tones = new Set(['Ravi', 'Anita', 'Zoya', 'Mohan', 'Lakshmi', 'Kiran', 'Deepa', 'Arun'].map(n => getAvatarColor(n).bg));
    expect(tones.size).toBeGreaterThan(1);
  });
});
