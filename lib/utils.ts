import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a currency string (EUR)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a date object or string to a human-readable string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get month name from month number (1-12)
 * @param month - Month number (1-12)
 * @returns Month name in Dutch
 */
export function getMonthName(month: number): string {
  const months = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];
  return months[month - 1] || '';
}

/**
 * Get current year and the next 4 years as select options
 * @returns Array of year objects
 */
export function getYearOptions(): { value: number; label: string }[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const year = currentYear + i;
    return { value: year, label: year.toString() };
  });
}

/**
 * Get month options (1-12)
 * @returns Array of month objects
 */
export function getMonthOptions(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month, label: getMonthName(month) };
  });
} 