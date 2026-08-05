import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomCalendarPickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const CustomCalendarPicker: React.FC<CustomCalendarPickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  // Parse initial selected date
  const selectedDate = useMemo(() => {
    if (!value) return new Date();
    const parts = value.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth()); // 0-11
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);

  // Generate Year options
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list: number[] = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    // First day of current month
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Total days in current month
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Total days in previous month
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isSelected: boolean;
    }> = [];

    // Previous month trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const mStr = String(prevMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${prevYear}-${mStr}-${dStr}`;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateStr,
        isSelected: value === dateStr
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${viewYear}-${mStr}-${dStr}`;
      days.push({
        day: d,
        isCurrentMonth: true,
        dateStr,
        isSelected: value === dateStr
      });
    }

    // Next month leading days (to fill 35 or 42 grid cells)
    const totalSlots = days.length > 35 ? 42 : 35;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${nextYear}-${mStr}-${dStr}`;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateStr,
        isSelected: value === dateStr
      });
    }

    return days;
  }, [viewYear, viewMonth, value]);

  const handleSelectDay = (dateStr: string, isCurrentMonth: boolean) => {
    onChange(dateStr);
    const parts = dateStr.split('-');
    if (!isCurrentMonth && parts.length === 3) {
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm select-none ${className}`}>
      {/* Top Header: Pill Dropdowns for Month and Year */}
      <div className="flex items-center justify-center space-x-3 mb-5">
        {/* Month Selector Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowMonthSelect(!showMonthSelect);
              setShowYearSelect(false);
            }}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            <span>{MONTH_NAMES[viewMonth]}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showMonthSelect ? 'rotate-180' : ''}`} />
          </button>

          {showMonthSelect && (
            <div className="absolute top-full left-0 mt-1.5 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto py-1.5">
              {MONTH_NAMES.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setViewMonth(idx);
                    setShowMonthSelect(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    idx === viewMonth 
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold' 
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Year Selector Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowYearSelect(!showYearSelect);
              setShowMonthSelect(false);
            }}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            <span>{viewYear}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showYearSelect ? 'rotate-180' : ''}`} />
          </button>

          {showYearSelect && (
            <div className="absolute top-full right-0 mt-1.5 w-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto py-1.5">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setViewYear(y);
                    setShowYearSelect(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    y === viewYear 
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold' 
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
        {calendarDays.map((item, index) => {
          const displayDay = String(item.day).padStart(2, '0');
          return (
            <div key={index} className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleSelectDay(item.dateStr, item.isCurrentMonth)}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-xs sm:text-sm rounded-full transition-all cursor-pointer ${
                  item.isSelected
                    ? 'bg-[#00a2e8] text-white font-extrabold shadow-md shadow-[#00a2e8]/40 scale-105'
                    : item.isCurrentMonth
                    ? 'font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95'
                    : 'font-normal text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {displayDay}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
