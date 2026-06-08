import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateLuhn(base: string): string {
  let sum = 0;
  let shouldDouble = true;

  // Process from right to left (excluding check digit)
  for (let i = base.length - 1; i >= 0; i--) {
    let digit = parseInt(base[i], 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const checkDigit = (10 - (sum % 10)) % 10;

  return base + checkDigit;
}