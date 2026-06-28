export type EditableNumber = number | '';

export function parseEditableNumber(rawValue: string): EditableNumber {
  const value = rawValue.trim();
  if (value === '') return '';

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : '';
}

export function normalizePositiveQuantity(value: EditableNumber): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return value;
}

export function isValidProductForm(input: {
  name: string;
  packPrice: EditableNumber;
  packSize: EditableNumber;
}): boolean {
  return (
    input.name.trim().length > 0 &&
    typeof input.packPrice === 'number' &&
    Number.isFinite(input.packPrice) &&
    input.packPrice >= 0 &&
    typeof input.packSize === 'number' &&
    Number.isFinite(input.packSize) &&
    input.packSize > 0
  );
}

export function numberInputValue(value: EditableNumber): string | number {
  return value === '' ? '' : value;
}
