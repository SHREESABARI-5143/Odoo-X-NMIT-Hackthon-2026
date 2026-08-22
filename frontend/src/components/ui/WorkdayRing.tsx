import React from 'react';

interface WorkdayRingProps {
  workHoursMins: number;
  isCheckedIn: boolean;
}

export const WorkdayRing: React.FC<WorkdayRingProps> = ({ workHoursMins, isCheckedIn }) => {
  const hours = Math.floor(workHoursMins / 60);
  const mins = workHoursMins % 60;
  const targetMins = 480; // 8 hours
  const percentage = Math.min(100, Math.round((workHoursMins / targetMins) * 100));

  const strokeDasharray = 251.2; // 2 * PI * 40
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          className="text-[#E7E4E1]"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          className="text-[#714B67] transition-all duration-500 ease-out"
          strokeWidth="8"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {isCheckedIn || workHoursMins > 0 ? (
          <>
            <span className="text-base font-bold text-[#252525]">
              {hours}h {mins}m
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6B6B]">
              WORKED
            </span>
          </>
        ) : (
          <span className="text-xs font-medium text-[#6B6B6B]">Not started</span>
        )}
      </div>
    </div>
  );
};
