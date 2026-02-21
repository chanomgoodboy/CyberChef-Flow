import { mod, modInverse } from './alphabet';

/**
 * Multiply two square matrices mod m.
 */
export function matMulMod(a: number[][], b: number[][], m: number): number[][] {
  const n = a.length;
  const result: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = mod(sum, m);
    }
  }
  return result;
}

/**
 * Multiply a square matrix by a column vector mod m.
 */
export function matVecMulMod(mat: number[][], vec: number[], m: number): number[] {
  const n = mat.length;
  const result = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += mat[i][j] * vec[j];
    }
    result[i] = mod(sum, m);
  }
  return result;
}

/**
 * Determinant of a square matrix mod m (recursive).
 */
export function matDetMod(mat: number[][], m: number): number {
  const n = mat.length;
  if (n === 1) return mod(mat[0][0], m);
  if (n === 2) return mod(mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0], m);

  let det = 0;
  for (let j = 0; j < n; j++) {
    const minor = mat.slice(1).map((row) => [...row.slice(0, j), ...row.slice(j + 1)]);
    const cofactor = (j % 2 === 0 ? 1 : -1) * mat[0][j];
    det += cofactor * matDetMod(minor, m);
  }
  return mod(det, m);
}

/**
 * Inverse of a square matrix mod m using adjugate method.
 * Throws if the matrix is not invertible.
 */
export function matInverseMod(mat: number[][], m: number): number[][] {
  const n = mat.length;
  const det = matDetMod(mat, m);
  const detInv = modInverse(det, m);
  if (detInv < 0) {
    throw new Error(`Matrix is not invertible mod ${m} (det=${det})`);
  }

  // Cofactor matrix
  const cofactors: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const minor = mat
        .filter((_, ri) => ri !== i)
        .map((row) => row.filter((_, ci) => ci !== j));
      cofactors[i][j] = mod(((i + j) % 2 === 0 ? 1 : -1) * matDetMod(minor, m), m);
    }
  }

  // Transpose (adjugate) and multiply by detInv
  const result: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      result[i][j] = mod(cofactors[j][i] * detInv, m);
    }
  }
  return result;
}
