const EXP = new Array<number>(512).fill(0);
const LOG = new Array<number>(256).fill(0);

(function buildGaloisTables() {
  let value = 1;
  for (let index = 0; index < 255; index += 1) {
    EXP[index] = value;
    LOG[value] = index;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }
  for (let index = 255; index < 512; index += 1) EXP[index] = EXP[index - 255];
})();

function gfMultiply(left: number, right: number) {
  if (!left || !right) return 0;
  return EXP[LOG[left] + LOG[right]];
}

function generatorPolynomial(length: number) {
  let generator = [1];
  for (let degree = 0; degree < length; degree += 1) {
    const next = new Array(generator.length + 1).fill(0);
    for (let index = 0; index < generator.length; index += 1) {
      next[index] ^= generator[index];
      next[index + 1] ^= gfMultiply(generator[index], EXP[degree]);
    }
    generator = next;
  }
  return generator;
}

function errorCorrection(data: number[], length: number) {
  const generator = generatorPolynomial(length);
  let remainder = new Array(length).fill(0);

  for (const value of data) {
    const factor = value ^ remainder[0];
    remainder = remainder.slice(1).concat(0);
    if (!factor) continue;
    for (let index = 0; index < length; index += 1) {
      remainder[index] ^= gfMultiply(generator[index + 1], factor);
    }
  }
  return remainder;
}

function appendBits(target: number[], value: number, length: number) {
  for (let bit = length - 1; bit >= 0; bit -= 1) target.push((value >>> bit) & 1);
}

function formatBits(mask: number) {
  const data = (0b01 << 3) | mask; // Error correction level L.
  let remainder = data << 10;
  const generator = 0x537;
  const bitLength = (value: number) => value === 0 ? 0 : Math.floor(Math.log2(value)) + 1;

  while (bitLength(remainder) >= bitLength(generator)) {
    remainder ^= generator << (bitLength(remainder) - bitLength(generator));
  }

  return ((data << 10) | remainder) ^ 0x5412;
}

function makeCodewords(text: string) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const version = bytes.length <= 53 ? 3 : bytes.length <= 78 ? 4 : 0;
  if (!version) throw new Error("QR payload is too long");

  const dataCodewords = version === 3 ? 55 : 80;
  const eccLength = version === 3 ? 15 : 20;
  const bits: number[] = [];

  appendBits(bits, 0b0100, 4); // byte mode
  appendBits(bits, bytes.length, 8);
  for (const byte of bytes) appendBits(bits, byte, 8);

  const capacity = dataCodewords * 8;
  for (let index = 0; index < Math.min(4, capacity - bits.length); index += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);

  const data: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    let value = 0;
    for (let bit = 0; bit < 8; bit += 1) value = (value << 1) | bits[index + bit];
    data.push(value);
  }

  const pads = [0xec, 0x11];
  while (data.length < dataCodewords) data.push(pads[(data.length - Math.ceil(bits.length / 8)) & 1]);

  return { version, codewords: data.concat(errorCorrection(data, eccLength)) };
}

export function makeQrMatrix(text: string) {
  const { version, codewords } = makeCodewords(text);
  const size = version * 4 + 17;
  const modules: Array<Array<boolean | null>> = Array.from({ length: size }, () => Array(size).fill(null));

  const finder = (row: number, column: number) => {
    for (let dr = -1; dr <= 7; dr += 1) {
      const targetRow = row + dr;
      if (targetRow < 0 || targetRow >= size) continue;
      for (let dc = -1; dc <= 7; dc += 1) {
        const targetColumn = column + dc;
        if (targetColumn < 0 || targetColumn >= size) continue;
        const dark =
          (dr >= 0 && dr <= 6 && (dc === 0 || dc === 6)) ||
          (dc >= 0 && dc <= 6 && (dr === 0 || dr === 6)) ||
          (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
        modules[targetRow][targetColumn] = dark;
      }
    }
  };

  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);

  const alignmentCenter = version === 3 ? 22 : 26;
  for (let dr = -2; dr <= 2; dr += 1) {
    for (let dc = -2; dc <= 2; dc += 1) {
      modules[alignmentCenter + dr][alignmentCenter + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
    }
  }

  for (let index = 8; index < size - 8; index += 1) {
    if (modules[index][6] === null) modules[index][6] = index % 2 === 0;
    if (modules[6][index] === null) modules[6][index] = index % 2 === 0;
  }

  const mask = 0;
  const info = formatBits(mask);
  for (let index = 0; index < 15; index += 1) {
    const dark = ((info >>> index) & 1) === 1;

    if (index < 6) modules[index][8] = dark;
    else if (index < 8) modules[index + 1][8] = dark;
    else modules[size - 15 + index][8] = dark;

    if (index < 8) modules[8][size - index - 1] = dark;
    else if (index < 9) modules[8][15 - index] = dark;
    else modules[8][15 - index - 1] = dark;
  }
  modules[size - 8][8] = true;

  let byteIndex = 0;
  let bitIndex = 7;
  let row = size - 1;
  let increment = -1;

  for (let column = size - 1; column > 0; column -= 2) {
    if (column === 6) column -= 1;

    while (true) {
      for (let offset = 0; offset < 2; offset += 1) {
        const targetColumn = column - offset;
        if (modules[row][targetColumn] !== null) continue;

        let dark = false;
        if (byteIndex < codewords.length) dark = ((codewords[byteIndex] >>> bitIndex) & 1) === 1;
        if ((row + targetColumn) % 2 === 0) dark = !dark;
        modules[row][targetColumn] = dark;

        bitIndex -= 1;
        if (bitIndex < 0) {
          byteIndex += 1;
          bitIndex = 7;
        }
      }

      row += increment;
      if (row < 0 || row >= size) {
        row -= increment;
        increment = -increment;
        break;
      }
    }
  }

  return modules.map((line) => line.map(Boolean));
}

export function qrSvg(text: string, scale = 8, border = 4) {
  const matrix = makeQrMatrix(text);
  const size = matrix.length;
  const dimension = (size + border * 2) * scale;
  const cells: string[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (!matrix[row][column]) continue;
      cells.push(`<rect x="${(column + border) * scale}" y="${(row + border) * scale}" width="${scale}" height="${scale}"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${dimension}" viewBox="0 0 ${dimension} ${dimension}" role="img" aria-label="LunchDrop QR code"><rect width="100%" height="100%" fill="#fff"/><g fill="#171612">${cells.join("")}</g></svg>`;
}
