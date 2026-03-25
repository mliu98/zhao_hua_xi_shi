import { describe, it, expect } from 'vitest';
import { getMemoryLayout } from './pseudoRandom';

describe('getMemoryLayout', () => {
  it('returns the same layout for the same id', () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    expect(getMemoryLayout(id)).toEqual(getMemoryLayout(id));
  });

  it('returns different layouts for different ids', () => {
    const a = getMemoryLayout('id-one');
    const b = getMemoryLayout('id-two');
    expect(a).not.toEqual(b);
  });

  it('x is within 5–70', () => {
    for (let i = 0; i < 50; i++) {
      const { x } = getMemoryLayout(`test-id-${i}`);
      expect(x).toBeGreaterThanOrEqual(5);
      expect(x).toBeLessThanOrEqual(70);
    }
  });

  it('y is within 5–70', () => {
    for (let i = 0; i < 50; i++) {
      const { y } = getMemoryLayout(`test-id-${i}`);
      expect(y).toBeGreaterThanOrEqual(5);
      expect(y).toBeLessThanOrEqual(70);
    }
  });

  it('rotation is within -12–12', () => {
    for (let i = 0; i < 50; i++) {
      const { rotation } = getMemoryLayout(`test-id-${i}`);
      expect(rotation).toBeGreaterThanOrEqual(-12);
      expect(rotation).toBeLessThanOrEqual(12);
    }
  });
});
