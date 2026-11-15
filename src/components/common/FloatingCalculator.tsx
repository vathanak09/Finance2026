import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Undo2,
  Redo2,
  Minus,
  X,
  Delete,
  Copy,
  Check,
  Calculator,
  GripHorizontal,
} from 'lucide-react';
import {
  evaluateExpression,
  formatCalcNumber,
  formatExpressionForDisplay,
  isOperator,
} from '../../utils/calculatorEngine';

interface FloatingCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const MEMORY_STORAGE_KEY = 'finance_floating_calc_memory';

export const FloatingCalculator: React.FC<FloatingCalculatorProps> = ({ isOpen, onClose }) => {
  const [expression, setExpression] = useState<string>('0');
  const [justEvaluated, setJustEvaluated] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(['0']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [memory, setMemory] = useState<number>(() => {
    const saved = localStorage.getItem(MEMORY_STORAGE_KEY);
    const parsed = saved ? parseFloat(saved) : 0;
    return isNaN(parsed) ? 0 : parsed;
  });
  const [memoryFlash, setMemoryFlash] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Floating position (clamped to viewport)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 400;
    const h = typeof window !== 'undefined' ? window.innerHeight : 700;
    const cardW = 308;
    const cardH = 490;
    return {
      x: Math.max(12, w - cardW - 24),
      y: Math.max(16, Math.min(h - cardH - 24, 96)),
    };
  });

  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const exprScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(MEMORY_STORAGE_KEY, memory.toString());
  }, [memory]);

  // Keep card inside viewport on resize or expand/minimize toggle
  const clampPosition = useCallback((x: number, y: number, minimized: boolean) => {
    if (typeof window === 'undefined') return { x, y };
    const cardW = minimized ? 168 : Math.min(312, window.innerWidth - 16);
    const cardH = minimized ? 48 : 495;
    return {
      x: Math.max(8, Math.min(window.innerWidth - cardW - 8, x)),
      y: Math.max(8, Math.min(window.innerHeight - cardH - 8, y)),
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y, isMinimized));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition, isMinimized]);

  useEffect(() => {
    setPosition((prev) => clampPosition(prev.x, prev.y, isMinimized));
  }, [isMinimized, clampPosition]);

  // Keep long expressions scrolled to the right edge as the user types
  useEffect(() => {
    if (exprScrollRef.current) {
      exprScrollRef.current.scrollLeft = exprScrollRef.current.scrollWidth;
    }
  }, [expression]);

  // Mouse & touch dragging on window listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMovedRef.current = true;
      setPosition(clampPosition(initialPosRef.current.x + dx, initialPosRef.current.y + dy, isMinimized));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches[0]) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMovedRef.current = true;
      setPosition(clampPosition(initialPosRef.current.x + dx, initialPosRef.current.y + dy, isMinimized));
    };

    const stopDrag = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [clampPosition, isMinimized]);

  const startMouseDrag = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
  };

  const startTouchDrag = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    initialPosRef.current = { ...position };
  };

  const commitExpression = useCallback(
    (nextExpr: string, nextEvaluated = false) => {
      setErrorMsg(null);
      setJustEvaluated(nextEvaluated);
      setExpression(nextExpr);
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        if (sliced[sliced.length - 1] === nextExpr) return sliced;
        const updated = [...sliced, nextExpr].slice(-50);
        setHistoryIndex(updated.length - 1);
        return updated;
      });
    },
    [historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const prevIdx = historyIndex - 1;
    setHistoryIndex(prevIdx);
    setExpression(history[prevIdx]);
    setJustEvaluated(false);
    setErrorMsg(null);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    setHistoryIndex(nextIdx);
    setExpression(history[nextIdx]);
    setJustEvaluated(false);
    setErrorMsg(null);
  };

  const handleDigit = useCallback(
    (digit: string) => {
      if (justEvaluated) {
        if (digit === '.') {
          commitExpression('0.');
        } else if (digit === '0' || digit === '00') {
          commitExpression('0');
        } else {
          commitExpression(digit);
        }
        return;
      }

      if (digit === '.') {
        const segments = expression.split(/[+\-*/%]/);
        const currentSeg = segments[segments.length - 1] || '';
        if (currentSeg.includes('.')) return;
        const lastChar = expression[expression.length - 1];
        if (!lastChar || isOperator(lastChar) || lastChar === '%') {
          const prefix = lastChar === '%' ? `${expression}*` : expression;
          commitExpression(`${prefix}0.`);
        } else {
          commitExpression(`${expression}.`);
        }
        return;
      }

      if (expression === '0') {
        if (digit === '0' || digit === '00') return;
        commitExpression(digit);
        return;
      }

      // If trailing segment is just "0" after an operator, replace it cleanly
      const matchTrailingZero = expression.match(/([+\-*/])0$/);
      if (matchTrailingZero) {
        if (digit === '0' || digit === '00') return;
        commitExpression(expression.slice(0, -1) + digit);
        return;
      }

      const lastChar = expression[expression.length - 1];
      if (lastChar === '%') {
        commitExpression(`${expression}*${digit === '00' ? '0' : digit}`);
        return;
      }

      commitExpression(`${expression}${digit}`);
    },
    [commitExpression, expression, justEvaluated]
  );

  const handleOperator = useCallback(
    (op: '+' | '-' | '*' | '/') => {
      if (!expression) {
        if (op === '-') commitExpression('-');
        return;
      }

      const lastChar = expression[expression.length - 1];
      if (lastChar === '.') {
        commitExpression(`${expression}0${op}`);
        return;
      }

      if (isOperator(lastChar)) {
        // Replace previous trailing operator
        if (expression.length === 1 && expression === '-' && op !== '-') {
          commitExpression('0');
          return;
        }
        commitExpression(`${expression.slice(0, -1)}${op}`);
        return;
      }

      commitExpression(`${expression}${op}`);
    },
    [commitExpression, expression]
  );

  const handlePercent = useCallback(() => {
    if (!expression) return;
    const lastChar = expression[expression.length - 1];
    if (isOperator(lastChar) || lastChar === '%' || lastChar === '.') return;
    commitExpression(`${expression}%`);
  }, [commitExpression, expression]);

  const handleBackspace = useCallback(() => {
    if (justEvaluated) {
      commitExpression('0');
      return;
    }
    if (expression.length <= 1) {
      if (expression !== '0') commitExpression('0');
      return;
    }
    commitExpression(expression.slice(0, -1));
  }, [commitExpression, expression, justEvaluated]);

  const handleClear = useCallback(() => {
    commitExpression('0');
  }, [commitExpression]);

  const handleEquals = useCallback(() => {
    const evaluated = evaluateExpression(expression);
    if (evaluated === null) {
      setErrorMsg('មិនអាចគណនាបាន');
      return;
    }
    const cleanStr = Number(evaluated.toFixed(8)).toString();
    commitExpression(cleanStr, true);
  }, [commitExpression, expression]);

  const liveValue = evaluateExpression(expression);

  // Memory Operations
  const flashMemory = (label: string) => {
    setMemoryFlash(label);
    setTimeout(() => setMemoryFlash(null), 900);
  };

  const handleMemoryClear = () => {
    setMemory(0);
    flashMemory('MC');
  };

  const handleMemoryAdd = () => {
    if (liveValue === null) return;
    setMemory((prev) => Number((prev + liveValue).toPrecision(12)));
    setJustEvaluated(true);
    flashMemory('M+');
  };

  const handleMemorySubtract = () => {
    if (liveValue === null) return;
    setMemory((prev) => Number((prev - liveValue).toPrecision(12)));
    setJustEvaluated(true);
    flashMemory('M−');
  };

  const handleMemoryRecall = () => {
    const memStr = Number(memory.toFixed(8)).toString();
    if (justEvaluated || expression === '0') {
      commitExpression(memStr);
      return;
    }
    const lastChar = expression[expression.length - 1];
    if (isOperator(lastChar)) {
      if (memory < 0 && lastChar === '+') {
        commitExpression(`${expression.slice(0, -1)}${memStr}`);
      } else if (memory < 0 && lastChar === '-') {
        commitExpression(`${expression.slice(0, -1)}+${Math.abs(memory)}`);
      } else {
        commitExpression(`${expression}${memStr}`);
      }
    } else {
      commitExpression(memStr);
    }
    flashMemory('MR');
  };

  const handleCopyResult = async () => {
    const valToCopy =
      liveValue !== null ? Number(liveValue.toFixed(8)).toString() : expression;
    try {
      await navigator.clipboard.writeText(valToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  // Optional keyboard support when open & expanded (only if user isn't typing into another input)
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleDigit('.');
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        e.preventDefault();
        handleOperator(e.key);
      } else if (e.key === '%') {
        e.preventDefault();
        handlePercent();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsMinimized(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isOpen,
    isMinimized,
    handleDigit,
    handleOperator,
    handlePercent,
    handleEquals,
    handleBackspace,
    handleClear,
  ]);

  if (!isOpen) return null;

  const formattedDisplayExpr = formatExpressionForDisplay(expression);
  const formattedPreview =
    errorMsg || (liveValue !== null ? formatCalcNumber(liveValue) : '');

  // Minimized floating pill view
  if (isMinimized) {
    return createPortal(
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        onMouseDown={startMouseDrag}
        onTouchStart={startTouchDrag}
        onClick={() => {
          if (!hasMovedRef.current) setIsMinimized(false);
        }}
        className="fixed z-[160] flex items-center space-x-2 px-3.5 py-2.5 rounded-full bg-[#eef3ea]/95 dark:bg-slate-900/95 border border-emerald-300/80 dark:border-emerald-700/70 shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing select-none touch-none hover:scale-[1.03] transition-transform"
        title="ចុចដើម្បីបើកម៉ាស៊ីនគិតលេខ"
      >
        <div className="w-7 h-7 rounded-full bg-[#006e4d] dark:bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
          <Calculator className="w-3.5 h-3.5" />
        </div>
        <div className="text-left pr-1">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">
            {memory !== 0 ? `M: ${formatCalcNumber(memory)}` : 'គិតលេខ'}
          </p>
          <p className="text-xs font-black text-slate-900 dark:text-white leading-tight max-w-[100px] truncate">
            {liveValue !== null ? formatCalcNumber(liveValue) : formattedDisplayExpr}
          </p>
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 rounded-full hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 cursor-pointer"
          title="បិទ"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>,
      document.body
    );
  }

  const numBtnClass =
    'h-11 sm:h-12 rounded-full bg-[#dfe8d8] hover:bg-[#d2dfc9] active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold text-lg transition-all flex items-center justify-center cursor-pointer select-none';
  const opBtnClass =
    'h-11 sm:h-12 rounded-full bg-[#c6dcc5] hover:bg-[#b7d2b6] active:scale-95 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 text-emerald-950 dark:text-emerald-300 font-bold text-lg transition-all flex items-center justify-center cursor-pointer select-none';

  return createPortal(
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-[160] w-[304px] sm:w-[316px] max-w-[calc(100vw-16px)] rounded-[28px] bg-[#eef3ea]/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-200/80 dark:border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.22)] p-3.5 space-y-2.5 select-none transition-colors"
    >
      {/* Top Drag Header & Controls (Matches Reference Image) */}
      <div
        onMouseDown={startMouseDrag}
        onTouchStart={startTouchDrag}
        className="flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing touch-none px-0.5"
      >
        <div className="flex items-center space-x-1.5 min-w-0">
          <GripHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 truncate">
            គិតលេខ Mini
          </span>
        </div>

        <div
          className="flex items-center space-x-1 flex-shrink-0"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="w-7 h-7 rounded-full bg-[#e1e8dc] dark:bg-slate-800 hover:bg-[#d3ddd0] dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default"
            title="ថយក្រោយ (Undo)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="w-7 h-7 rounded-full bg-[#e1e8dc] dark:bg-slate-800 hover:bg-[#d3ddd0] dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default"
            title="ទៅមុខ (Redo)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopyResult}
            className="w-7 h-7 rounded-full bg-[#e1e8dc] dark:bg-slate-800 hover:bg-[#d3ddd0] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="ចម្លងលទ្ធផល (Copy)"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="w-7 h-7 rounded-full bg-[#e1e8dc] dark:bg-slate-800 hover:bg-[#d3ddd0] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="បង្រួម (Minimize)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#e1e8dc] dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
            title="បិទ (Close)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Display Box */}
      <div className="bg-white dark:bg-slate-950/90 rounded-2xl px-3.5 py-3 border border-emerald-100 dark:border-slate-800 shadow-inner space-y-1">
        <div className="flex items-center justify-between min-h-[16px]">
          {memory !== 0 || memoryFlash ? (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold font-mono">
              <span>{memoryFlash ? `${memoryFlash} • ` : ''}M = {formatCalcNumber(memory)}</span>
            </span>
          ) : (
            <span />
          )}
          {copied && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              បានចម្លង!
            </span>
          )}
        </div>

        <div
          ref={exprScrollRef}
          className="w-full overflow-x-auto text-right whitespace-nowrap scrollbar-none"
        >
          <span
            className={`font-bold tracking-tight text-slate-900 dark:text-white ${
              formattedDisplayExpr.length > 14 ? 'text-xl' : 'text-[26px]'
            } leading-tight`}
          >
            {formattedDisplayExpr}
          </span>
        </div>

        <div className="text-right min-h-[20px]">
          <span
            className={`text-sm font-semibold ${
              errorMsg
                ? 'text-rose-500 dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {formattedPreview}
          </span>
        </div>
      </div>

      {/* Memory Buttons Row: MC, MR, M+, M- */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={handleMemoryClear}
          disabled={memory === 0}
          className="h-8 rounded-full bg-[#d6e4d2] hover:bg-[#c6dac2] disabled:opacity-45 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-emerald-950 dark:text-emerald-300 text-xs font-extrabold transition-all active:scale-95 cursor-pointer disabled:cursor-default"
          title="សម្អាត Memory (Memory Clear)"
        >
          MC
        </button>
        <button
          type="button"
          onClick={handleMemoryRecall}
          disabled={memory === 0}
          className="h-8 rounded-full bg-[#d6e4d2] hover:bg-[#c6dac2] disabled:opacity-45 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-emerald-950 dark:text-emerald-300 text-xs font-extrabold transition-all active:scale-95 cursor-pointer disabled:cursor-default"
          title="ទាញយកតម្លៃ Memory (Memory Recall)"
        >
          MR
        </button>
        <button
          type="button"
          onClick={handleMemoryAdd}
          disabled={liveValue === null}
          className="h-8 rounded-full bg-[#c6dcc5] hover:bg-[#b5d0b4] disabled:opacity-45 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-emerald-950 dark:text-emerald-300 text-xs font-extrabold transition-all active:scale-95 cursor-pointer disabled:cursor-default"
          title="បូកបន្ថែមចូល Memory (Memory Add)"
        >
          M+
        </button>
        <button
          type="button"
          onClick={handleMemorySubtract}
          disabled={liveValue === null}
          className="h-8 rounded-full bg-[#c6dcc5] hover:bg-[#b5d0b4] disabled:opacity-45 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-emerald-950 dark:text-emerald-300 text-xs font-extrabold transition-all active:scale-95 cursor-pointer disabled:cursor-default"
          title="ដកចេញពី Memory (Memory Subtract)"
        >
          M−
        </button>
      </div>

      {/* Main 5x4 Keypad */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <button type="button" onClick={handleClear} className={opBtnClass}>
          C
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className={opBtnClass}
          title="លុបមួយខ្ទង់"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button type="button" onClick={handlePercent} className={opBtnClass}>
          %
        </button>
        <button type="button" onClick={() => handleOperator('/')} className={opBtnClass}>
          ÷
        </button>

        {/* Row 2 */}
        <button type="button" onClick={() => handleDigit('7')} className={numBtnClass}>
          7
        </button>
        <button type="button" onClick={() => handleDigit('8')} className={numBtnClass}>
          8
        </button>
        <button type="button" onClick={() => handleDigit('9')} className={numBtnClass}>
          9
        </button>
        <button type="button" onClick={() => handleOperator('*')} className={opBtnClass}>
          ×
        </button>

        {/* Row 3 */}
        <button type="button" onClick={() => handleDigit('4')} className={numBtnClass}>
          4
        </button>
        <button type="button" onClick={() => handleDigit('5')} className={numBtnClass}>
          5
        </button>
        <button type="button" onClick={() => handleDigit('6')} className={numBtnClass}>
          6
        </button>
        <button type="button" onClick={() => handleOperator('-')} className={opBtnClass}>
          −
        </button>

        {/* Row 4 */}
        <button type="button" onClick={() => handleDigit('1')} className={numBtnClass}>
          1
        </button>
        <button type="button" onClick={() => handleDigit('2')} className={numBtnClass}>
          2
        </button>
        <button type="button" onClick={() => handleDigit('3')} className={numBtnClass}>
          3
        </button>
        <button type="button" onClick={() => handleOperator('+')} className={opBtnClass}>
          +
        </button>

        {/* Row 5 */}
        <button type="button" onClick={() => handleDigit('0')} className={numBtnClass}>
          0
        </button>
        <button type="button" onClick={() => handleDigit('00')} className={numBtnClass}>
          00
        </button>
        <button type="button" onClick={() => handleDigit('.')} className={numBtnClass}>
          .
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className="h-11 sm:h-12 rounded-full bg-[#006e4d] hover:bg-[#005c40] active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xl shadow-md shadow-emerald-700/25 transition-all flex items-center justify-center cursor-pointer select-none"
        >
          =
        </button>
      </div>
    </div>,
    document.body
  );
};
