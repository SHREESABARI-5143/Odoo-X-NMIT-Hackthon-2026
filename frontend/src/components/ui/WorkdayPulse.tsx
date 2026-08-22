import React from 'react';

interface WorkdayPulseProps {
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status?: string;
}

export const WorkdayPulse: React.FC<WorkdayPulseProps> = ({
  checkInTime,
  checkOutTime,
  status,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-[#E7E4E1] my-3">
      <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-2 font-medium">
        <span>Workday Timeline</span>
        <span className="text-[#714B67] font-semibold">{status || 'Standard Shift (8h)'}</span>
      </div>
      <div className="relative flex items-center justify-between pt-3 pb-1">
        {/* Connection line */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[#E7E4E1] -translate-y-1/2 z-0" />

        {/* Check In node */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
              checkInTime ? 'bg-[#3FA66B]' : 'bg-[#E7E4E1]'
            }`}
          />
          <span className="text-[11px] font-semibold text-[#252525] mt-1.5">
            {checkInTime || '09:00 AM'}
          </span>
          <span className="text-[10px] text-[#6B6B6B]">Check In</span>
        </div>

        {/* Break node */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
              checkInTime ? 'bg-[#F6A23A]' : 'bg-[#E7E4E1]'
            }`}
          />
          <span className="text-[11px] font-semibold text-[#252525] mt-1.5">1:00 PM</span>
          <span className="text-[10px] text-[#6B6B6B]">Break</span>
        </div>

        {/* Resume node */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
              checkInTime ? 'bg-[#4F7CAC]' : 'bg-[#E7E4E1]'
            }`}
          />
          <span className="text-[11px] font-semibold text-[#252525] mt-1.5">2:00 PM</span>
          <span className="text-[10px] text-[#6B6B6B]">Resume</span>
        </div>

        {/* Check Out node */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
              checkOutTime ? 'bg-[#714B67]' : 'bg-[#E7E4E1]'
            }`}
          />
          <span className="text-[11px] font-semibold text-[#252525] mt-1.5">
            {checkOutTime || '5:00 PM'}
          </span>
          <span className="text-[10px] text-[#6B6B6B]">Check Out</span>
        </div>
      </div>
    </div>
  );
};
