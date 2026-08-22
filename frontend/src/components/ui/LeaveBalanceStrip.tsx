import React from 'react';

interface LeaveAllocationItem {
  allocated: number;
  used: number;
  remaining: number;
}

interface LeaveBalanceStripProps {
  paid: LeaveAllocationItem;
  sick: LeaveAllocationItem;
  unpaid: LeaveAllocationItem;
}

export const LeaveBalanceStrip: React.FC<LeaveBalanceStripProps> = ({ paid, sick, unpaid }) => {
  const items = [
    { title: 'PAID LEAVE', data: paid, color: 'bg-[#714B67]', text: 'text-[#714B67]' },
    { title: 'SICK LEAVE', data: sick, color: 'bg-[#F6A23A]', text: 'text-[#F6A23A]' },
    { title: 'UNPAID LEAVE', data: unpaid, color: 'bg-[#4F7CAC]', text: 'text-[#4F7CAC]' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
      {items.map((item, idx) => {
        const pct = item.data.allocated > 0 ? Math.min(100, (item.data.remaining / item.data.allocated) * 100) : 0;
        return (
          <div key={idx} className="bg-white p-4 rounded-xl border border-[#E7E4E1] shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6B6B6B]">
              <span>{item.title}</span>
              <span className="text-[11px]">
                {item.data.used} / {item.data.allocated} used
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-bold ${item.text}`}>{item.data.remaining}</span>
              <span className="text-xs text-[#6B6B6B] font-medium">days remaining</span>
            </div>
            <div className="w-full bg-[#E7E4E1] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-300`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
