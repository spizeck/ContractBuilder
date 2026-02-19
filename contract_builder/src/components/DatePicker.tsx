"use client";

import React, { useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseDateOnly, toInputDate } from "@/utils/formatters";

// Two usage modes:
//   1. String mode: pass `value` ("YYYY-MM-DD" | null) — onChange emits "YYYY-MM-DD" | null
//   2. Date mode:   pass `selected` (Date | null)       — onChange emits Date | null
//
// These are mutually exclusive: pass either `value` or `selected`, not both.

interface CustomDatePickerProps {
  /** String mode: "YYYY-MM-DD" stored value (no timezone shift) */
  value?: string | null;
  /** Date mode: native Date object */
  selected?: Date | null;
  /**
   * In string mode, receives "YYYY-MM-DD" | null.
   * In date mode, receives Date | null.
   */
  onChange: ((value: string | null) => void) | ((date: Date | null) => void);
  placeholder?: string;
  isClearable?: boolean;
  dateFormat?: string;
  className?: string;
}

const styleId = "chakra-react-datepicker-styles";
const portalId = "date-picker-portal";

const chakraDatePickerStyles = `
  /* ===== Input field ===== */
  .chakra-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--chakra-colors-border);
    border-radius: var(--chakra-radii-md);
    font-size: var(--chakra-fontSizes-md);
    background-color: var(--chakra-colors-chakra-body-bg);
    color: var(--chakra-colors-chakra-body-text);
    transition: border-color 0.2s, box-shadow 0.2s;
    line-height: 1.5;
  }

  .chakra-input:focus {
    outline: none;
    border-color: var(--chakra-colors-blue-500);
    box-shadow: 0 0 0 1px var(--chakra-colors-blue-500);
  }

  .chakra-input::placeholder {
    color: var(--chakra-colors-chakra-placeholder-color);
  }

  /* ===== Calendar popup container ===== */
  .chakra-datepicker-calendar {
    background-color: var(--chakra-colors-chakra-body-bg) !important;
    border: 1px solid var(--chakra-colors-border) !important;
    border-radius: var(--chakra-radii-lg) !important;
    box-shadow: var(--chakra-shadows-lg) !important;
    font-family: var(--chakra-fonts-body) !important;
    color: var(--chakra-colors-chakra-body-text) !important;
  }

  /* ===== Calendar header (month/year navigation) ===== */
  .chakra-datepicker-calendar .react-datepicker__header {
    background-color: var(--chakra-colors-chakra-subtle-bg) !important;
    border-bottom: 1px solid var(--chakra-colors-border) !important;
    border-top-left-radius: var(--chakra-radii-lg) !important;
    border-top-right-radius: var(--chakra-radii-lg) !important;
    padding: 0.5rem !important;
  }

  .chakra-datepicker-calendar .react-datepicker__current-month,
  .chakra-datepicker-calendar .react-datepicker-year-header,
  .chakra-datepicker-calendar .react-datepicker__day-name {
    color: var(--chakra-colors-chakra-body-text) !important;
  }

  /* ===== Navigation arrows ===== */
  .chakra-datepicker-calendar .react-datepicker__navigation-icon::before {
    border-color: var(--chakra-colors-chakra-body-text) !important;
    opacity: 0.7;
  }

  .chakra-datepicker-calendar .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
    border-color: var(--chakra-colors-blue-500) !important;
    opacity: 1;
  }

  /* ===== Days ===== */
  .chakra-datepicker-calendar .react-datepicker__day {
    color: var(--chakra-colors-chakra-body-text) !important;
    border-radius: var(--chakra-radii-md) !important;
    margin: 0.125rem !important;
  }

  .chakra-datepicker-calendar .react-datepicker__day:hover {
    background-color: var(--chakra-colors-chakra-subtle-bg) !important;
    color: var(--chakra-colors-chakra-body-text) !important;
  }

  .chakra-datepicker-calendar .react-datepicker__day--selected,
  .chakra-datepicker-calendar .react-datepicker__day--selected:hover {
    background-color: var(--chakra-colors-blue-500) !important;
    color: white !important;
  }

  .chakra-datepicker-calendar .react-datepicker__day--keyboard-selected {
    background-color: var(--chakra-colors-blue-100) !important;
    color: var(--chakra-colors-blue-700) !important;
  }

  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__day--keyboard-selected,
  .dark .chakra-datepicker-calendar .react-datepicker__day--keyboard-selected {
    background-color: var(--chakra-colors-blue-800) !important;
    color: var(--chakra-colors-blue-100) !important;
  }

  .chakra-datepicker-calendar .react-datepicker__day--today {
    font-weight: var(--chakra-fontWeights-semibold) !important;
    border: 1px solid var(--chakra-colors-blue-400) !important;
    background-color: transparent !important;
  }

  .chakra-datepicker-calendar .react-datepicker__day--today.react-datepicker__day--selected {
    border-color: transparent !important;
    background-color: var(--chakra-colors-blue-500) !important;
    color: white !important;
  }

  .chakra-datepicker-calendar .react-datepicker__day--outside-month {
    color: var(--chakra-colors-chakra-placeholder-color) !important;
  }

  .chakra-datepicker-calendar .react-datepicker__day--disabled {
    color: var(--chakra-colors-chakra-placeholder-color) !important;
    opacity: 0.4 !important;
    cursor: not-allowed !important;
  }

  /* ===== Month/year dropdowns ===== */
  .chakra-datepicker-calendar .react-datepicker__month-select,
  .chakra-datepicker-calendar .react-datepicker__year-select {
    background-color: var(--chakra-colors-chakra-body-bg) !important;
    color: var(--chakra-colors-chakra-body-text) !important;
    border: 1px solid var(--chakra-colors-border) !important;
    border-radius: var(--chakra-radii-sm) !important;
    padding: 0.1rem 0.25rem !important;
    font-size: var(--chakra-fontSizes-sm) !important;
  }

  /* ===== Year dropdown (scroll list) ===== */
  .chakra-datepicker-calendar .react-datepicker__year-dropdown {
    background-color: var(--chakra-colors-chakra-body-bg) !important;
    border: 1px solid var(--chakra-colors-border) !important;
    border-radius: var(--chakra-radii-md) !important;
    box-shadow: var(--chakra-shadows-lg) !important;
    max-height: 14rem !important;
    overflow-y: auto !important;
    padding: 0.25rem 0 !important;
    width: 9rem !important;
  }

  .chakra-datepicker-calendar .react-datepicker__year-option {
    padding: 0.35rem 0.75rem !important;
    color: var(--chakra-colors-chakra-body-text) !important;
    cursor: pointer !important;
    line-height: 1.2 !important;
  }

  .chakra-datepicker-calendar .react-datepicker__year-option:hover {
    background-color: var(--chakra-colors-chakra-subtle-bg) !important;
  }

  .chakra-datepicker-calendar .react-datepicker__year-option--selected_year,
  .chakra-datepicker-calendar .react-datepicker__year-option--selected {
    background-color: var(--chakra-colors-blue-500) !important;
    color: white !important;
  }

  /* Hide the spurious checkmark column */
  .chakra-datepicker-calendar .react-datepicker__year-option::before {
    display: none !important;
    content: "" !important;
  }

  /* ===== Portal overlay (withPortal) ===== */
  .react-datepicker__portal {
    background-color: rgba(0, 0, 0, 0.5) !important;
  }

  [data-theme="dark"] .react-datepicker__portal,
  .dark .react-datepicker__portal {
    background-color: rgba(0, 0, 0, 0.7) !important;
  }

  /* ===== Dark mode overrides for calendar body bg ===== */
  [data-theme="dark"] .chakra-datepicker-calendar,
  .dark .chakra-datepicker-calendar {
    background-color: var(--chakra-colors-gray-800) !important;
    border-color: var(--chakra-colors-gray-600) !important;
  }

  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__header,
  .dark .chakra-datepicker-calendar .react-datepicker__header {
    background-color: var(--chakra-colors-gray-700) !important;
    border-bottom-color: var(--chakra-colors-gray-600) !important;
  }

  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__year-dropdown,
  .dark .chakra-datepicker-calendar .react-datepicker__year-dropdown {
    background-color: var(--chakra-colors-gray-800) !important;
    border-color: var(--chakra-colors-gray-600) !important;
  }

  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__year-option:hover,
  .dark .chakra-datepicker-calendar .react-datepicker__year-option:hover {
    background-color: var(--chakra-colors-gray-700) !important;
  }

  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__month-select,
  [data-theme="dark"] .chakra-datepicker-calendar .react-datepicker__year-select,
  .dark .chakra-datepicker-calendar .react-datepicker__month-select,
  .dark .chakra-datepicker-calendar .react-datepicker__year-select {
    background-color: var(--chakra-colors-gray-700) !important;
    border-color: var(--chakra-colors-gray-500) !important;
    color: var(--chakra-colors-gray-100) !important;
  }

  /* Clear button (×) inside the input */
  .react-datepicker__close-icon::after {
    background-color: var(--chakra-colors-gray-400) !important;
    color: white !important;
  }

  .react-datepicker__close-icon:hover::after {
    background-color: var(--chakra-colors-gray-500) !important;
  }

  [data-theme="dark"] .react-datepicker__close-icon::after,
  .dark .react-datepicker__close-icon::after {
    background-color: var(--chakra-colors-gray-500) !important;
  }
`;

export default function CustomDatePicker({
  value,
  selected,
  onChange,
  placeholder = "Select date",
  isClearable = true,
  dateFormat = "yyyy-MM-dd",
  className = "",
}: CustomDatePickerProps) {
  // Resolve the selected Date regardless of which API the caller uses
  let selectedDate: Date | null;
  let handleChange: (date: Date | null) => void;

  if (selected !== undefined) {
    // Date mode — caller passes a Date object directly
    selectedDate = selected ?? null;
    handleChange = onChange as (date: Date | null) => void;
  } else {
    // String mode — parse "YYYY-MM-DD" without UTC shift
    selectedDate = value ? parseDateOnly(value) : null;
    const strOnChange = onChange as (value: string | null) => void;
    handleChange = (date) => {
      if (!date) return strOnChange(null);
      strOnChange(toInputDate(date));
    };
  }

  useEffect(() => {
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = chakraDatePickerStyles;
      document.head.appendChild(styleEl);
    }

    if (!document.getElementById(portalId)) {
      const portal = document.createElement("div");
      portal.id = portalId;
      document.body.appendChild(portal);
    }
  }, []);

  return (
    <DatePicker
      selected={selectedDate}
      onChange={handleChange}
      placeholderText={placeholder}
      isClearable={isClearable}
      dateFormat={dateFormat}
      className={`chakra-input ${className}`}
      wrapperClassName="w-full"
      calendarClassName="chakra-datepicker-calendar"
      withPortal
      portalId={portalId}
      toggleCalendarOnIconClick
      showYearDropdown
      scrollableYearDropdown
      yearDropdownItemNumber={10}
    />
  );
}
