export interface Period {
  label: string;
  value: string;
  dateRange: {
    startMonth: number; // 1-12
    endMonth: number; // 1-12
  };
} 