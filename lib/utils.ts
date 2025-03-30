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

/**
 * Format een getal als percentage
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

/**
 * Berekent het verschil tussen twee waarden en retourneert een percentage
 */
export const calculateVariance = (actual: number, planned: number): number => {
  if (planned === 0) return actual > 0 ? 100 : 0;
  return Math.round(((actual - planned) / Math.abs(planned)) * 100);
};

/**
 * Bepaal kleur op basis van variantie en type (inkomsten of uitgaven)
 */
export const getVarianceColor = (variance: number, isExpense: boolean = false): string => {
  // Voor inkomsten: positieve variantie is goed (groen), negatieve is slecht (rood)
  // Voor uitgaven: negatieve variantie is goed (groen), positieve is slecht (rood)
  if (isExpense) {
    if (variance <= -10) return 'text-green-500';
    if (variance < 0) return 'text-green-400';
    if (variance === 0) return 'text-gray-500';
    if (variance <= 10) return 'text-amber-500';
    return 'text-red-500';
  } else {
    if (variance >= 10) return 'text-green-500';
    if (variance > 0) return 'text-green-400';
    if (variance === 0) return 'text-gray-500';
    if (variance >= -10) return 'text-amber-500';
    return 'text-red-500';
  }
};

/**
 * Helper functie om periode naam te genereren
 */
export const getPeriodName = (period: string, year: number, month: number): string => {
  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];
  
  switch (period) {
    case 'month':
      return `${monthNames[month - 1]} ${year}`;
    case 'quarter':
      const quarter = Math.ceil(month / 3);
      return `Q${quarter} ${year}`;
    case 'half-year':
      return month <= 6 ? `H1 ${year}` : `H2 ${year}`;
    case 'year':
      return `Jaar ${year}`;
    default:
      return `${monthNames[month - 1]} ${year}`;
  }
}; 