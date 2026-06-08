import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateLuhnId(length = 16): string {
  const baseLength = length - 1;

  let base = "";
  for (let i = 0; i < baseLength; i++) {
    base += Math.floor(Math.random() * 10);
  }

  let sum = 0;
  let shouldDouble = true;

  for (let i = base.length - 1; i >= 0; i--) {
    let digit = Number(base[i]);

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