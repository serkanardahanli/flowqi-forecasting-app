'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Base styling voor form elementen
const baseInputClass = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 !text-gray-900 placeholder-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const baseErrorClass = "mt-1 text-sm text-red-600";
const baseLabelClass = "block text-sm font-medium text-gray-700";
const baseSelectClass = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 !text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const baseOptionClass = "text-gray-900 !text-gray-900 font-medium";
const baseOptionPlaceholderClass = "text-gray-900 !text-gray-900 font-medium";

// Label Component
export const FormLabel = ({ 
  children, 
  htmlFor, 
  className, 
  required 
}: { 
  children: React.ReactNode; 
  htmlFor?: string; 
  className?: string;
  required?: boolean;
}) => (
  <label htmlFor={htmlFor} className={cn(baseLabelClass, className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

// Input Component
export const FormInput = forwardRef<
  HTMLInputElement, 
  React.ComponentPropsWithoutRef<"input"> & { 
    error?: string;
    label?: string;
    required?: boolean;
  }
>(({ className, error, label, id, required, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
    )}
    <input
      ref={ref}
      id={id}
      className={cn(
        baseInputClass,
        error ? "border-red-300" : "border-gray-300",
        className
      )}
      {...props}
    />
    {error && <p className={baseErrorClass}>{error}</p>}
  </div>
));
FormInput.displayName = "FormInput";

// Select Component
export const FormSelect = forwardRef<
  HTMLSelectElement,
  React.ComponentPropsWithoutRef<"select"> & {
    error?: string;
    label?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
  }
>(({ className, error, label, id, options, placeholder, required, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
    )}
    <select
      ref={ref}
      id={id}
      className={cn(
        baseSelectClass,
        error ? "border-red-300" : "border-gray-300",
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" className={baseOptionPlaceholderClass}>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} className={baseOptionClass}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className={baseErrorClass}>{error}</p>}
  </div>
));
FormSelect.displayName = "FormSelect";

// Textarea Component
export const FormTextarea = forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea"> & {
    error?: string;
    label?: string;
    required?: boolean;
  }
>(({ className, error, label, id, required, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
    )}
    <textarea
      ref={ref}
      id={id}
      className={cn(
        baseInputClass,
        error ? "border-red-300" : "border-gray-300",
        className
      )}
      {...props}
    />
    {error && <p className={baseErrorClass}>{error}</p>}
  </div>
));
FormTextarea.displayName = "FormTextarea";

// Checkbox Component
export const FormCheckbox = forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input"> & {
    error?: string;
    label?: string;
  }
>(({ className, error, label, id, ...props }, ref) => (
  <div className="flex items-center">
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className={cn(
        "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500",
        className
      )}
      {...props}
    />
    {label && (
      <label htmlFor={id} className="ml-2 block text-sm text-gray-900">
        {label}
      </label>
    )}
    {error && <p className={baseErrorClass}>{error}</p>}
  </div>
));
FormCheckbox.displayName = "FormCheckbox";

// Radio Component
export const FormRadio = forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input"> & {
    error?: string;
    label?: string;
  }
>(({ className, error, label, id, ...props }, ref) => (
  <div className="flex items-center">
    <input
      ref={ref}
      id={id}
      type="radio"
      className={cn(
        "h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500",
        className
      )}
      {...props}
    />
    {label && (
      <label htmlFor={id} className="ml-2 block text-sm text-gray-900">
        {label}
      </label>
    )}
    {error && <p className={baseErrorClass}>{error}</p>}
  </div>
));
FormRadio.displayName = "FormRadio";

// Form Error Message
export const FormErrorMessage = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn(baseErrorClass, className)}>{children}</p>
);

// Form Group
export const FormGroup = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-4", className)}>
    {children}
  </div>
);

// Form Row - voor horizontale layout
export const FormRow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
    {children}
  </div>
); 