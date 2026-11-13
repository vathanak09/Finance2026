import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption<T extends string | number = string> {
  value: T;
  label: string;
}

interface CustomSelectProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: CustomSelectOption<T>[];
  className?: string;
  menuClassName?: string;
  placeholder?: string;
  align?: 'left' | 'right';
  size?: 'xs' | 'sm' | 'md';
  accentColor?: 'blue' | 'emerald';
}

export function CustomSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  className = '',
  menuClassName = '',
  placeholder = 'ជ្រើសរើស...',
  align = 'left',
  size = 'xs',
  accentColor = 'blue',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();

    // Close if button is completely scrolled out of viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setIsOpen(false);
      return;
    }

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const minW = Math.min(Math.max(rect.width, 136), viewportW - 24);

    const spaceBelow = viewportH - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;

    const style: React.CSSProperties = {
      minWidth: `${minW}px`,
      maxWidth: `${viewportW - 24}px`,
    };

    if (align === 'right' || (rect.left + minW > viewportW - 12 && rect.right >= minW)) {
      style.right = `${Math.max(12, viewportW - rect.right)}px`;
    } else {
      style.left = `${Math.max(12, rect.left)}px`;
    }

    if (openUpward) {
      style.bottom = `${viewportH - rect.top + 6}px`;
      style.maxHeight = `${Math.min(256, Math.max(100, spaceAbove))}px`;
    } else {
      style.top = `${rect.bottom + 6}px`;
      style.maxHeight = `${Math.min(256, Math.max(120, spaceBelow))}px`;
    }

    setMenuStyle(style);
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updatePosition]);

  const activeTextClass =
    accentColor === 'emerald'
      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
      : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300';

  const checkIconClass =
    accentColor === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-blue-600 dark:text-blue-400';

  const chevronActiveClass =
    accentColor === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-blue-500 dark:text-blue-400';

  const itemTextSize =
    size === 'md' ? 'text-sm' : size === 'sm' ? 'text-xs sm:text-sm' : 'text-xs';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`inline-flex items-center justify-between gap-2 outline-none cursor-pointer transition-all ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150 ${
            isOpen ? `rotate-180 ${chevronActiveClass}` : 'text-slate-400'
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[199] cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            <div
              ref={menuRef}
              role="listbox"
              style={menuStyle}
              onClick={(e) => e.stopPropagation()}
              className={`fixed z-[200] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-1.5 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl ${itemTextSize} font-bold text-left transition-colors cursor-pointer ${
                      isSelected
                        ? activeTextClass
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="whitespace-nowrap">{opt.label}</span>
                    {isSelected && (
                      <Check className={`w-3.5 h-3.5 flex-shrink-0 ${checkIconClass}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
