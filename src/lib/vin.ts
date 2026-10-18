const TRANSLIT: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const YEARS = 'ABCDEFGHJKLMNPRSTVWXY123456789';

export function normalizeVin(v: string) {
  return v.toUpperCase().replace(/[\s-]/g, '');
}

export function vinFormatError(vin: string): string | null {
  if (vin.length !== 17) return 'VIN номерът трябва да е точно 17 символа.';
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return 'VIN съдържа недопустими символи (букви I, O и Q не се използват).';
  return null;
}

export function vinChecksumValid(vin: string) {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = vin[i];
    const v = /\d/.test(c) ? Number(c) : TRANSLIT[c];
    sum += v * WEIGHTS[i];
  }
  const rem = sum % 11;
  return vin[8] === (rem === 10 ? 'X' : String(rem));
}

export function computeCheckDigit(vin17: string) {
  const tmp = vin17.slice(0, 8) + '0' + vin17.slice(9);
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = tmp[i];
    sum += (/\d/.test(c) ? Number(c) : TRANSLIT[c]) * WEIGHTS[i];
  }
  const rem = sum % 11;
  return rem === 10 ? 'X' : String(rem);
}

/** Година по 10-ия символ: два възможни цикъла (1980–2009 / 2010–2039). */
export function vinYearCandidates(vin: string) {
  const i = YEARS.indexOf(vin[9]);
  return i < 0 ? [] : [1980 + i, 2010 + i];
}
