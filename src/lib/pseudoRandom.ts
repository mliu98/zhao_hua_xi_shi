/**
 * Deterministic layout generator for memory cards.
 * Given the same memory id, always returns the same position and rotation.
 * No database storage needed.
 */

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed: number) {
  let s = seed;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MemoryLayout {
  x: number       // percentage 5–70
  y: number       // percentage 5–70
  rotation: number // degrees -12–12
}

export function getMemoryLayout(memoryId: string): MemoryLayout {
  const rand = mulberry32(hashString(memoryId));
  return {
    x: 5 + rand() * 65,
    y: 5 + rand() * 65,
    rotation: -12 + rand() * 24,
  };
}
