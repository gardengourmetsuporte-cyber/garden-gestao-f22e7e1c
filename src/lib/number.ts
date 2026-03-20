export function parseLocalizedNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let str = String(value).trim();
  if (!str) return 0;

  str = str.replace(/[¤$€£¥\sR$]/g, '');

  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');
  const hasComma = lastComma !== -1;
  const hasDot = lastDot !== -1;

  const commaAsDecimal = hasComma && (!hasDot || lastComma > lastDot);

  if (commaAsDecimal) {
    str = str.replace(/\./g, '');
    str = str.replace(/,/g, '.');
  } else {
    str = str.replace(/,/g, '');
  }

  str = str.replace(/(?!^)-/g, '');

  const parsed = parseFloat(str);
  return Number.isFinite(parsed) ? parsed : 0;
}
