import React, { useState, useMemo, useRef } from 'react';

interface CustomClockTimePickerProps {
  value: string; // 'HH:mm' in 24h format, e.g. '19:00' or '07:00'
  onChange: (time24: string) => void;
  className?: string;
}

export const CustomClockTimePicker: React.FC<CustomClockTimePickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [activeUnit, setActiveUnit] = useState<'hours' | 'minutes'>('hours');
  const clockRef = useRef<HTMLDivElement>(null);

  // Parse 24h into 12h, minutes, and AM/PM
  const { hour12, minute, period } = useMemo(() => {
    if (!value) return { hour12: 12, minute: 0, period: 'PM' as 'AM' | 'PM' };
    const parts = value.split(':');
    let h = parseInt(parts[0] || '12', 10);
    const m = parseInt(parts[1] || '0', 10);
    if (isNaN(h)) h = 12;
    const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return { hour12: h, minute: isNaN(m) ? 0 : m, period: p };
  }, [value]);

  // Convert 12h + minute + period to 24h string
  const updateTime = (h: number, m: number, p: 'AM' | 'PM') => {
    let h24 = h;
    if (p === 'PM' && h24 < 12) h24 += 12;
    if (p === 'AM' && h24 === 12) h24 = 0;
    const hStr = String(h24).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  const handleHourSelect = (newH: number) => {
    updateTime(newH, minute, period);
    // Smoothly transition to selecting minutes after picking hour
    setActiveUnit('minutes');
  };

  const handleMinuteSelect = (newM: number) => {
    updateTime(hour12, newM, period);
  };

  const handlePeriodChange = (newP: 'AM' | 'PM') => {
    updateTime(hour12, minute, newP);
  };

  // Clock geometry constants
  const size = 220;
  const center = size / 2; // 110
  const radius = 78;

  // Calculate angle for current selection
  const currentAngle = useMemo(() => {
    if (activeUnit === 'hours') {
      return (hour12 % 12) * 30; // 0 for 12, 30 for 1, 210 for 7, etc.
    } else {
      return (minute % 60) * 6; // 0 for 00, 30 for 05, etc.
    }
  }, [activeUnit, hour12, minute]);

  // Handle click/touch directly on clock dial to compute angle
  const handleClockInteract = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);

    let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    if (activeUnit === 'hours') {
      let h = Math.round(deg / 30);
      if (h === 0) h = 12;
      if (h > 12) h = 12;
      handleHourSelect(h);
    } else {
      let m = Math.round(deg / 6);
      if (m >= 60) m = 0;
      handleMinuteSelect(m);
    }
  };

  // Numbers to display around the clock face
  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Selected thumb coordinates
  const rad = ((currentAngle - 90) * Math.PI) / 180;
  const thumbX = center + radius * Math.cos(rad);
  const thumbY = center + radius * Math.sin(rad);

  const displayHourStr = String(hour12).padStart(2, '0');
  const displayMinuteStr = String(minute).padStart(2, '0');

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm select-none ${className}`}>
      {/* Title */}
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3.5">
        Select time
      </div>

      {/* Digital Time Cards & AM/PM Toggle */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-5">
        {/* Hour Card */}
        <button
          type="button"
          onClick={() => setActiveUnit('hours')}
          className={`w-20 h-16 sm:w-24 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-medium transition-all cursor-pointer ${
            activeUnit === 'hours'
              ? 'bg-[#c7b9ff]/60 dark:bg-indigo-950/80 text-[#3b2d71] dark:text-indigo-200 border-2 border-[#5b45a0]/40'
              : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 border border-transparent'
          }`}
        >
          {displayHourStr}
        </button>

        {/* Colon */}
        <span className="text-3xl sm:text-4xl font-bold text-slate-700 dark:text-slate-300 pb-1">
          :
        </span>

        {/* Minute Card */}
        <button
          type="button"
          onClick={() => setActiveUnit('minutes')}
          className={`w-20 h-16 sm:w-24 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-medium transition-all cursor-pointer ${
            activeUnit === 'minutes'
              ? 'bg-[#c7b9ff]/60 dark:bg-indigo-950/80 text-[#3b2d71] dark:text-indigo-200 border-2 border-[#5b45a0]/40'
              : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 border border-transparent'
          }`}
        >
          {displayMinuteStr}
        </button>

        {/* AM / PM Toggle Box */}
        <div className="w-14 sm:w-16 h-16 sm:h-20 rounded-2xl border border-slate-300 dark:border-slate-700 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => handlePeriodChange('AM')}
            className={`flex-1 flex items-center justify-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              period === 'AM'
                ? 'bg-[#fbcfe8] text-[#831843] dark:bg-pink-900/60 dark:text-pink-200 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            AM
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={() => handlePeriodChange('PM')}
            className={`flex-1 flex items-center justify-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              period === 'PM'
                ? 'bg-[#fbcfe8] text-[#831843] dark:bg-pink-900/60 dark:text-pink-200 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            PM
          </button>
        </div>
      </div>

      {/* Analog Clock Face Dial */}
      <div className="flex items-center justify-center">
        <div
          ref={clockRef}
          onClick={handleClockInteract}
          className="relative rounded-full bg-slate-100 dark:bg-slate-800/70 flex items-center justify-center cursor-pointer select-none shadow-inner"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          {/* Center pivot dot and pointer hand */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {/* Center Pivot */}
            <circle cx={center} cy={center} r={4.5} fill="#5b45a0" className="dark:fill-indigo-400" />
            {/* Hand line */}
            <line
              x1={center}
              y1={center}
              x2={thumbX}
              y2={thumbY}
              stroke="#5b45a0"
              strokeWidth={2}
              className="dark:stroke-indigo-400"
            />
            {/* Selected Thumb Circle */}
            <circle cx={thumbX} cy={thumbY} r={17} fill="#5b45a0" className="dark:fill-indigo-500" />
          </svg>

          {/* Numbers positioned on the dial */}
          {activeUnit === 'hours' ? (
            hoursList.map((h) => {
              const hAngle = (h % 12) * 30;
              const hRad = ((hAngle - 90) * Math.PI) / 180;
              const numX = center + radius * Math.cos(hRad);
              const numY = center + radius * Math.sin(hRad);
              const isSelected = h === hour12;

              return (
                <div
                  key={h}
                  style={{
                    position: 'absolute',
                    left: `${numX}px`,
                    top: `${numY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`w-8 h-8 flex items-center justify-center text-xs sm:text-sm font-medium pointer-events-none z-20 transition-colors ${
                    isSelected
                      ? 'text-white font-bold'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {h}
                </div>
              );
            })
          ) : (
            minutesList.map((m) => {
              const mAngle = (m % 60) * 6;
              const mRad = ((mAngle - 90) * Math.PI) / 180;
              const numX = center + radius * Math.cos(mRad);
              const numY = center + radius * Math.sin(mRad);
              const isSelected = m === minute;

              return (
                <div
                  key={m}
                  style={{
                    position: 'absolute',
                    left: `${numX}px`,
                    top: `${numY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`w-8 h-8 flex items-center justify-center text-xs sm:text-sm font-medium pointer-events-none z-20 transition-colors ${
                    isSelected
                      ? 'text-white font-bold'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {String(m).padStart(2, '0')}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
