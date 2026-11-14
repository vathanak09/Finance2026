import React, { useRef, useLayoutEffect } from 'react';
import type { Currency } from '../../types/finance';

interface CurrencyInputProps {
  value: string | number;
  onChange: (rawValue: string) => void;
  currency?: Currency;
  placeholder?: string;
  required?: boolean;
  className?: string;
  hideSymbol?: boolean;
  onBlur?: () => void;
}

/**
 * Formats a raw numeric string (e.g. "12500.5") into a comma-separated string ("12,500.5")
 * while preserving trailing decimals like "12." or "12.0".
 */
const formatWithCommas = (raw: string): string => {
  if (!raw) return '';
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return '';

  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    const intPart = cleaned.slice(0, dotIndex);
    const decPart = cleaned.slice(dotIndex + 1).replace(/\./g, '');
    const formattedInt = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
    return `${formattedInt}.${decPart}`;
  }

  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Strips formatting commas and ensures at most one decimal point.
 */
const sanitizeRawNumber = (input: string): string => {
  const cleaned = input.replace(/[^0-9.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex === -1) {
    // Prevent unnecessary leading zeros like "005" -> "5", keep "0"
    if (cleaned.length > 1 && cleaned.startsWith('0')) {
      return cleaned.replace(/^0+/, '') || '0';
    }
    return cleaned;
  }
  const intPart = cleaned.slice(0, dotIndex).replace(/^0+(?=\d)/, '');
  const decPart = cleaned.slice(dotIndex + 1).replace(/\./g, '');
  return `${intPart || '0'}.${decPart}`;
};

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency = 'KHR',
  placeholder,
  required = false,
  className = '',
  hideSymbol = false,
  onBlur,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const nextCursorRef = useRef<number | null>(null);

  const rawStr = value === 0 || value === '0' ? String(value) : value ? String(value) : '';
  const displayValue = formatWithCommas(rawStr);

  useLayoutEffect(() => {
    if (nextCursorRef.current !== null && inputRef.current) {
      const pos = Math.min(nextCursorRef.current, displayValue.length);
      inputRef.current.setSelectionRange(pos, pos);
      nextCursorRef.current = null;
    }
  }, [displayValue]);

  const computeCursorFromSignificantCount = (formatted: string, sigCount: number): number => {
    if (sigCount <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/[0-9.]/.test(formatted[i])) {
        seen++;
        if (seen === sigCount) {
          return i + 1;
        }
      }
    }
    return formatted.length;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const selStart = e.target.selectionStart ?? inputVal.length;

    // Count significant numeric/dot chars before the cursor
    const beforeCursor = inputVal.slice(0, selStart);
    const sigCountBefore = (beforeCursor.match(/[0-9.]/g) || []).length;

    const nextRaw = sanitizeRawNumber(inputVal);
    const nextFormatted = formatWithCommas(nextRaw);

    const addedLeadingZero =
      nextRaw.startsWith('0.') && beforeCursor.replace(/[^0-9.]/g, '').startsWith('.');
    const adjustedSigCount = addedLeadingZero ? sigCountBefore + 1 : sigCountBefore;

    nextCursorRef.current = computeCursorFromSignificantCount(nextFormatted, adjustedSigCount);
    onChange(nextRaw);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputRef.current) {
      const { selectionStart, selectionEnd } = inputRef.current;
      // If cursor is right after a comma, delete the digit before that comma
      if (selectionStart !== null && selectionStart === selectionEnd && selectionStart >= 2) {
        if (displayValue[selectionStart - 1] === ',') {
          e.preventDefault();
          const withoutDigitBeforeComma =
            displayValue.slice(0, selectionStart - 2) + displayValue.slice(selectionStart - 1);
          const beforeSlice = displayValue.slice(0, selectionStart - 2);
          const sigCountBefore = (beforeSlice.match(/[0-9.]/g) || []).length;

          const nextRaw = sanitizeRawNumber(withoutDigitBeforeComma);
          const nextFormatted = formatWithCommas(nextRaw);
          nextCursorRef.current = computeCursorFromSignificantCount(nextFormatted, sigCountBefore);
          onChange(nextRaw);
        }
      }
    }
  };

  const currencyLabel = currency === 'USD' ? 'ដុល្លារ' : 'រៀល';

  const symbolPaddingClass = hideSymbol
    ? ''
    : currency === 'USD'
    ? '!pr-16'
    : '!pr-14';

  const resolvedPlaceholder =
    placeholder !== undefined ? placeholder : currency === 'USD' ? '0.00' : '0';

  return (
    <div className="relative flex items-center w-full">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        required={required}
        placeholder={resolvedPlaceholder}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        className={`${className} ${symbolPaddingClass}`}
      />
      {!hideSymbol && (
        <span
          className={`absolute right-3.5 text-xs font-extrabold pointer-events-none select-none ${
            currency === 'USD'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {currencyLabel}
        </span>
      )}
    </div>
  );
};
