'use client';

import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

export type Period = 'month' | 'quarter' | 'half-year' | 'year';

interface PeriodSelectorProps {
  period: Period;
  year: number;
  month: number;
  onPeriodChange: (period: Period) => void;
  onDateChange: (year: number, month: number) => void;
}

export default function PeriodSelector({
  period,
  year,
  month,
  onPeriodChange,
  onDateChange
}: PeriodSelectorProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Function to get month name
  const getMonthName = (monthNum: number) => {
    return new Date(2000, monthNum - 1, 1).toLocaleString('nl-NL', { month: 'long' });
  };

  // Function to get period display
  const getPeriodDisplay = () => {
    switch (period) {
      case 'month':
        return getMonthName(month) + ' ' + year;
      case 'quarter':
        return `Q${Math.ceil(month / 3)} ${year}`;
      case 'half-year':
        return `H${Math.ceil(month / 6)} ${year}`;
      case 'year':
        return `${year}`;
      default:
        return '';
    }
  };

  // Handler for month selection
  const handleMonthChange = (newMonth: number) => {
    onDateChange(year, newMonth);
    setIsDatePickerOpen(false);
  };

  // Navigation functions for Previous/Next periods
  const navigatePrevious = () => {
    switch (period) {
      case 'month':
        if (month === 1) {
          onDateChange(year - 1, 12);
        } else {
          onDateChange(year, month - 1);
        }
        break;
      case 'quarter':
        const prevQuarterMonth = month - 3;
        if (prevQuarterMonth < 1) {
          onDateChange(year - 1, 12 - (3 - prevQuarterMonth));
        } else {
          onDateChange(year, prevQuarterMonth);
        }
        break;
      case 'half-year':
        if (month <= 6) {
          onDateChange(year - 1, 7);
        } else {
          onDateChange(year, 1);
        }
        break;
      case 'year':
        onDateChange(year - 1, month);
        break;
    }
  };

  const navigateNext = () => {
    switch (period) {
      case 'month':
        if (month === 12) {
          onDateChange(year + 1, 1);
        } else {
          onDateChange(year, month + 1);
        }
        break;
      case 'quarter':
        const nextQuarterMonth = month + 3;
        if (nextQuarterMonth > 12) {
          onDateChange(year + 1, nextQuarterMonth - 12);
        } else {
          onDateChange(year, nextQuarterMonth);
        }
        break;
      case 'half-year':
        if (month > 6) {
          onDateChange(year + 1, 1);
        } else {
          onDateChange(year, 7);
        }
        break;
      case 'year':
        onDateChange(year + 1, month);
        break;
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between bg-white px-4 py-2 rounded-lg shadow border border-gray-200">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-indigo-600 mr-2" />
          <span className="font-medium text-gray-700 mr-2">Periode:</span>
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => onPeriodChange('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
                period === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 transition-colors`}
            >
              Maand
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('quarter')}
              className={`px-3 py-1.5 text-sm font-medium ${
                period === 'quarter'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-300 transition-colors`}
            >
              Kwartaal
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('half-year')}
              className={`px-3 py-1.5 text-sm font-medium ${
                period === 'half-year'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-300 transition-colors`}
            >
              Halfjaar
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('year')}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md ${
                period === 'year'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 transition-colors`}
            >
              Jaar
            </button>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow border border-gray-200">
        <button
          onClick={navigatePrevious}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="relative">
          <button
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="flex items-center px-3 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-medium transition-colors"
          >
            {getPeriodDisplay()}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDatePickerOpen && (
            <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200">
              {period === 'month' && (
                <div className="p-2">
                  <div className="flex justify-between items-center mb-2 px-2 py-1 border-b border-gray-200">
                    <button
                      onClick={() => onDateChange(year - 1, month)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="font-bold">{year}</span>
                    <button
                      onClick={() => onDateChange(year + 1, month)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <button
                        key={m}
                        onClick={() => handleMonthChange(m)}
                        className={`py-1.5 text-sm rounded-md ${
                          m === month
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {getMonthName(m).substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {period === 'quarter' && (
                <div className="p-2">
                  <div className="flex justify-between items-center mb-2 px-2 py-1 border-b border-gray-200">
                    <button
                      onClick={() => onDateChange(year - 1, month)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="font-bold">{year}</span>
                    <button
                      onClick={() => onDateChange(year + 1, month)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {[1, 4, 7, 10].map((m, i) => (
                      <button
                        key={m}
                        onClick={() => handleMonthChange(m)}
                        className={`py-2 text-sm rounded-md ${
                          Math.ceil(month / 3) === i + 1
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        Q{i + 1} ({getMonthName(m).substring(0, 3)}-{getMonthName(m + 2).substring(0, 3)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {period === 'half-year' && (
                <div className="p-2">
                  <div className="flex justify-between items-center mb-2 px-2 py-1 border-b border-gray-200">
                    <button
                      onClick={() => onDateChange(year - 1, month)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="font-bold">{year}</span>
                    <button
                      onClick={() => onDateChange(year + 1, month)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <button
                      onClick={() => handleMonthChange(1)}
                      className={`py-2 text-sm rounded-md ${
                        month <= 6
                          ? 'bg-indigo-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      H1 ({getMonthName(1)} - {getMonthName(6)})
                    </button>
                    <button
                      onClick={() => handleMonthChange(7)}
                      className={`py-2 text-sm rounded-md ${
                        month > 6
                          ? 'bg-indigo-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      H2 ({getMonthName(7)} - {getMonthName(12)})
                    </button>
                  </div>
                </div>
              )}
              
              {period === 'year' && (
                <div className="p-2">
                  <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                    {Array.from({ length: 10 }, (_, i) => year - 5 + i).map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          onDateChange(y, month);
                          setIsDatePickerOpen(false);
                        }}
                        className={`py-2 text-sm rounded-md ${
                          y === year
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={navigateNext}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
} 