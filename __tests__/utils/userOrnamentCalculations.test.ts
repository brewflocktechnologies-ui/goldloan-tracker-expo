import { calculateOrnamentValuation } from '../../src/utils/userOrnamentCalculations';
import { sanitizeDecimalInput, sanitizeIntegerInput } from '../../src/utils/numericInput';

describe('calculateOrnamentValuation', () => {
  it('nets out stone weight and values at buying price and the live rate', () => {
    const v = calculateOrnamentValuation(20, 2, 5000, 5500);
    expect(v.net).toBe(18);
    expect(v.totalBuyingValue).toBe(90000);
    expect(v.currentGoldValueLive).toBe(99000);
    expect(v.marketValue).toBe(Math.round(18 * 5500 * 1.0677));
    expect(v.appreciation).toBe(v.marketValue - 90000);
    expect(v.appreciationPct).toBeCloseTo((v.appreciation / 90000) * 100, 6);
  });

  it('never returns a negative net weight', () => {
    const v = calculateOrnamentValuation(2, 5, 5000, 5500);
    expect(v.net).toBe(0);
    expect(v.totalBuyingValue).toBe(0);
    expect(v.currentGoldValueLive).toBe(0);
  });

  it('returns zeros for zero weight', () => {
    const v = calculateOrnamentValuation(0, 0, 5000, 5500);
    expect(v.net).toBe(0);
    expect(v.marketValue).toBe(0);
    expect(v.appreciation).toBe(0);
  });

  it('uses the fallback percentage when there is no buying value', () => {
    expect(calculateOrnamentValuation(10, 0, 0, 5500).appreciationPct).toBe(29.31);
  });

  it('uses the fallback rate when no live rate is available', () => {
    const v = calculateOrnamentValuation(2, 0, 1000, 0);
    expect(v.currentGoldValueLive).toBe(0);
    expect(v.marketValue).toBe(410000);
  });

  it('rounds values to whole rupees', () => {
    const v = calculateOrnamentValuation(3.333, 0, 5555.55, 5500);
    expect(Number.isInteger(v.totalBuyingValue)).toBe(true);
    expect(Number.isInteger(v.currentGoldValueLive)).toBe(true);
    expect(Number.isInteger(v.marketValue)).toBe(true);
  });

  it('reports a negative appreciation when bought above market', () => {
    const v = calculateOrnamentValuation(10, 0, 9000, 5500);
    expect(v.appreciation).toBeLessThan(0);
    expect(v.appreciationPct).toBeLessThan(0);
  });
});

describe('sanitizeIntegerInput', () => {
  it.each([
    ['123', '123'],
    ['1a2b3', '123'],
    ['12.5', '125'],
    ['-7', '7'],
    ['', ''],
    ['abc', ''],
    [' 4 2 ', '42'],
  ])('%j -> %j', (input, expected) => {
    expect(sanitizeIntegerInput(input)).toBe(expected);
  });
});

describe('sanitizeDecimalInput', () => {
  it.each([
    ['12.5', '12.5'],
    ['12.5.3', '12.53'],
    ['1a2.b5', '12.5'],
    ['.5', '.5'],
    ['5.', '5.'],
    ['..', '.'],
    ['-3.2', '3.2'],
    ['', ''],
    ['abc', ''],
  ])('%j -> %j', (input, expected) => {
    expect(sanitizeDecimalInput(input)).toBe(expected);
  });
});
