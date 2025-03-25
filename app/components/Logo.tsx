'use client';

import Link from 'next/link';

export default function Logo() {
  return (
    <span className="flex items-center space-x-2">
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" fill="#6366F1" />
        <path d="M21 16C21 18.7614 18.7614 21 16 21C13.2386 21 11 18.7614 11 16C11 13.2386 13.2386 11 16 11C18.7614 11 21 13.2386 21 16Z" fill="white" />
        <path d="M25 10C25 11.6569 23.6569 13 22 13C20.3431 13 19 11.6569 19 10C19 8.34315 20.3431 7 22 7C23.6569 7 25 8.34315 25 10Z" fill="#E0E7FF" />
      </svg>
      <span className="font-bold text-xl text-gray-800">FlowQi</span>
    </span>
  );
} 