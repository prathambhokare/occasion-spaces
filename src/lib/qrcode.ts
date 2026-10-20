/**
 * Zero-dependency pure TypeScript QR Code Generator (Versions 1-6, Byte Mode, EC Level M)
 * Generates valid, high-contrast, scannable QR Code SVG strings and path data.
 */

// Format information bitstrings for Mask 0..7 with Error Correction Level M (00)
const FORMAT_INFO_M = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
];

// Galois Field (GF 2^8) tables for Reed-Solomon error correction
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    LOG_TABLE[val] = i;
    val = (val << 1) ^ (val & 0x80 ? 0x11d : 0);
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
}

function rsComputeRemainder(data: Uint8Array, numEcBytes: number): Uint8Array {
  // Compute generator polynomial coefficients
  let genPoly = new Uint8Array([1]);
  for (let i = 0; i < numEcBytes; i++) {
    const nextPoly = new Uint8Array(genPoly.length + 1);
    const root = EXP_TABLE[i];
    for (let j = 0; j < genPoly.length; j++) {
      nextPoly[j] ^= gfMultiply(genPoly[j], root);
      nextPoly[j + 1] ^= genPoly[j];
    }
    genPoly = nextPoly;
  }

  const remainder = new Uint8Array(numEcBytes);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[numEcBytes - 1] = 0;
    for (let i = 0; i < numEcBytes; i++) {
      remainder[i] ^= gfMultiply(genPoly[i], factor);
    }
  }
  return remainder;
}

// Version configs for Error Correction Level M: [Version, Total Modules, Data Capacity (Bytes), EC Bytes, Alignment Pattern Position]
interface VersionInfo {
  version: number;
  size: number;
  dataCapacity: number;
  ecBytes: number;
  alignPos?: number;
}

const VERSIONS: VersionInfo[] = [
  { version: 1, size: 21, dataCapacity: 14, ecBytes: 10 },
  { version: 2, size: 25, dataCapacity: 26, ecBytes: 16, alignPos: 18 },
  { version: 3, size: 29, dataCapacity: 42, ecBytes: 26, alignPos: 22 },
  { version: 4, size: 33, dataCapacity: 62, ecBytes: 36, alignPos: 26 },
  { version: 5, size: 37, dataCapacity: 84, ecBytes: 48, alignPos: 30 },
  { version: 6, size: 41, dataCapacity: 106, ecBytes: 64, alignPos: 34 },
];

export function generateQRCodeMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);

  // Find minimum version that fits data (Mode Byte + length indicator + data)
  const candidate = VERSIONS.find((v) => rawBytes.length + 2 <= v.dataCapacity);
  const version = candidate || VERSIONS[VERSIONS.length - 1];
  const size = version.size;

  // 1. Bit Buffer: 4 bits mode (0100 for Byte mode) + 8 bits count + raw data + terminator
  const bitArray: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitArray.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(rawBytes.length, 8); // Character count (8 bits for versions 1-9)
  for (const b of rawBytes) {
    pushBits(b, 8);
  }
  // Terminator
  const requiredBits = version.dataCapacity * 8;
  const termLen = Math.min(4, requiredBits - bitArray.length);
  pushBits(0, termLen);
  // Pad to byte boundary
  while (bitArray.length % 8 !== 0) {
    bitArray.push(0);
  }
  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitArray.length < requiredBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bit buffer to data bytes
  const dataBytes = new Uint8Array(version.dataCapacity);
  for (let i = 0; i < version.dataCapacity; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitArray[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

  // 2. Compute Reed-Solomon Error Correction Code
  const ecBytes = rsComputeRemainder(dataBytes, version.ecBytes);

  // Combine data + EC into full codeword sequence
  const fullCodewords = new Uint8Array(dataBytes.length + ecBytes.length);
  fullCodewords.set(dataBytes, 0);
  fullCodewords.set(ecBytes, dataBytes.length);

  // 3. Initialize Matrix & Function Pattern reservation
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isReserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, dark: boolean, reserved = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = dark;
      if (reserved) isReserved[r][c] = true;
    }
  };

  // Draw 7x7 Finder Pattern at (row, col)
  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          setModule(nr, nc, true);
        } else {
          setModule(nr, nc, false);
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Draw Alignment Pattern if version >= 2
  if (version.alignPos) {
    const ar = version.alignPos;
    const ac = version.alignPos;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isDark = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        setModule(ar + r, ac + c, isDark);
      }
    }
  }

  // Draw Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    const isDark = i % 2 === 0;
    setModule(6, i, isDark);
    setModule(i, 6, isDark);
  }

  // Reserve Format Information Area
  for (let i = 0; i < 9; i++) {
    setModule(8, i, false);
    setModule(i, 8, false);
    setModule(size - 1 - i, 8, false);
    setModule(8, size - 1 - i, false);
  }
  setModule(size - 8, 8, true); // Dark module

  // 4. Place Data Codewords (zigzag traversal)
  const allBits: number[] = [];
  for (const byte of fullCodewords) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((byte >> b) & 1);
    }
  }

  let bitIdx = 0;
  let upward = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip vertical timing line
    for (let rowStep = 0; rowStep < size; rowStep++) {
      const r = upward ? size - 1 - rowStep : rowStep;
      for (let cStep = 0; cStep < 2; cStep++) {
        const c = rightCol - cStep;
        if (!isReserved[r][c]) {
          const bitVal = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          // Apply Standard Mask Pattern 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bitVal === 1) !== mask;
        }
      }
    }
    upward = !upward;
  }

  // 5. Place Format Information (Mask 0, EC Level M -> 0x5412)
  const formatInfo = FORMAT_INFO_M[0];
  for (let i = 0; i < 15; i++) {
    const isDark = ((formatInfo >> i) & 1) === 1;
    if (i < 6) {
      matrix[i][8] = isDark;
    } else if (i < 8) {
      matrix[i + 1][8] = isDark;
    } else {
      matrix[8][15 - i] = isDark;
    }

    if (i < 8) {
      matrix[8][size - 1 - i] = isDark;
    } else {
      matrix[size - 15 + i][8] = isDark;
    }
  }

  return matrix;
}

/**
 * Returns an SVG string representation of the QR code matrix with customizable sizing and margin
 */
export function generateQRCodeSVG(
  text: string,
  options: { size?: number; margin?: number; color?: string; bgColor?: string } = {}
): string {
  const { size = 260, margin = 3, color = '#000000', bgColor = '#ffffff' } = options;
  const matrix = generateQRCodeMatrix(text);
  const matrixSize = matrix.length;
  const totalSize = matrixSize + margin * 2;

  let pathD = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        pathD += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${totalSize}" height="${totalSize}" fill="${bgColor}" />
    <path d="${pathD.trim()}" fill="${color}" />
  </svg>`;
}
