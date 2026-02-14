"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseDateOnly, toInputDate } from "@/utils/formatters";

interface DatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  isClearable?: boolean;
  dateFormat?: string;
  className?: string;
}

export default function CustomDatePicker({
  selected,
  onChange,
  placeholder = "Select date",
  isClearable = true,
  dateFormat = "yyyy-MM-dd",
  className = "",
}: DatePickerProps) {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      placeholderText={placeholder}
      isClearable={isClearable}
      dateFormat={dateFormat}
      className={`chakra-input ${className}`}
      wrapperClassName="w-full"
      calendarClassName="chakra-datepicker-calendar"
      withPortal
      portalId="date-picker-portal"
      showYearDropdown
      scrollableYearDropdown
      yearDropdownItemNumber={15}
    />
  );
}

// Simple Chakra-compatible styles using proper semantic tokens
const chakraDatePickerStyles = `
  .chakra-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--chakra-colors-border);
    border-radius: var(--chakra-radii-md);
    font-size: var(--chakra-fontSizes-md);
    background-color: var(--chakra-colors-chakra-body-bg);
    color: var(--chakra-colors-chakra-body-text);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  
  .chakra-input:focus {
    outline: none;
    border-color: var(--chakra-colors-blue-500);
    box-shadow: 0 0 0 1px var(--chakra-colors-blue-500);
  }
  
  .chakra-input::placeholder {
    color: var(--chakra-colors-chakra-placeholder-color);
  }
  
  .chakra-datepicker-calendar {
    background-color: var(--chakra-colors-chakra-body-bg);
    border: 1px solid var(--chakra-colors-border);
    border-radius: var(--chakra-radii-lg);
    box-shadow: var(--chakra-shadows-lg);
    font-family: var(--chakra-fonts-body);
  }
  
  .chakra-datepicker-calendar .react-datepicker__header {
    background-color: var(--chakra-colors-chakra-subtle-bg);
    border-bottom: 1px solid var(--chakra-colors-border);
    border-top-left-radius: var(--chakra-radii-lg);
    border-top-right-radius: var(--chakra-radii-lg);
    padding: 0.5rem;
  }
  
  .chakra-datepicker-calendar .react-datepicker__day {
    color: var(--chakra-colors-chakra-body-text);
    border-radius: var(--chakra-radii-md);
    margin: 0.125rem;
  }
  
  .chakra-datepicker-calendar .react-datepicker__day:hover {
    background-color: var(--chakra-colors-chakra-subtle-bg);
    color: var(--chakra-colors-chakra-body-text);
  }
  
  .chakra-datepicker-calendar .react-datepicker__day--selected {
    background-color: var(--chakra-colors-blue-500);
    color: white;
  }
  
  .chakra-datepicker-calendar .react-datepicker__day--keyboard-selected {
    background-color: var(--chakra-colors-blue-100);
    color: var(--chakra-colors-blue-700);
  }
  
  .chakra-datepicker-calendar .react-datepicker__day--today {
    background-color: var(--chakra-colors-chakra-muted-bg);
    color: var(--chakra-colors-chakra-body-text);
    font-weight: var(--chakra-fontWeights-semibold);
  }
  
  .chakra-datepicker-calendar .react-datepicker__navigation {
    color: var(--chakra-colors-chakra-subtle-text);
  }
  
  .chakra-datepicker-calendar .react-datepicker__navigation:hover {
    color: var(--chakra-colors-chakra-body-text);
  }
  
  /* Dark mode fixes - use actual Chakra color variables */
  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__day,
  .dark .chakra-datepicker-calendar .react-datepicker__day {
    color: var(--chakra-colors-gray-200) !important;
  }
  
  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__day:hover,
  .dark .chakra-datepicker-calendar .react-datepicker__day:hover {
    color: var(--chakra-colors-gray-200) !important;
  }
  
  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__day--today,
  .dark .chakra-datepicker-calendar .react-datepicker__day--today {
    color: var(--chakra-colors-gray-100) !important;
  }
  
  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__navigation,
  .dark .chakra-datepicker-calendar .react-datepicker__navigation {
    color: var(--chakra-colors-gray-400) !important;
  }
  
  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__navigation:hover,
  .dark .chakra-datepicker-calendar .react-datepicker__navigation:hover {
    color: var(--chakra-colors-gray-200) !important;
  }
`;

// Inject styles and create portal container
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = chakraDatePickerStyles;
  document.head.appendChild(styleElement);
  
  // Create portal container if it doesn't exist
  if (!document.getElementById('date-picker-portal')) {
    const portal = document.createElement('div');
    portal.id = 'date-picker-portal';
    document.body.appendChild(portal);
  }
}
