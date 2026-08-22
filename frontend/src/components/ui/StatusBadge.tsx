import React from 'react';
import { Plane, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-xs font-medium gap-1.5';

  switch (normalized) {
    case 'PRESENT':
      return (
        <span className={`inline-flex items-center rounded-full bg-[#3FA66B]/15 text-[#2E7D4E] font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3FA66B]" />
          Present
        </span>
      );

    case 'HALF_DAY':
    case 'HALF-DAY':
      return (
        <span className={`inline-flex items-center rounded-full bg-[#F6A23A]/15 text-[#C47513] font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F6A23A]" />
          Half-day
        </span>
      );

    case 'ON_LEAVE':
    case 'ON LEAVE':
      return (
        <span className={`inline-flex items-center rounded-full bg-[#4F7CAC]/15 text-[#375B82] font-medium ${sizeClasses}`}>
          <Plane className="w-3.5 h-3.5" />
          On Leave
        </span>
      );

    case 'ABSENT':
      return (
        <span className={`inline-flex items-center rounded-full bg-[#E5A72A]/15 text-[#9E6E10] font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5A72A]" />
          Absent
        </span>
      );

    case 'APPROVED':
      return (
        <span className={`inline-flex items-center rounded-full bg-[#3FA66B]/15 text-[#2E7D4E] font-medium ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-[#3FA66B]" />
          Approved
        </span>
      );

    case 'PENDING':
      return (
        <span className={`inline-flex items-center rounded-full bg-[#E5A72A]/15 text-[#9E6E10] font-medium ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-[#E5A72A]" />
          Pending
        </span>
      );

    case 'REJECTED':
      return (
        <span className={`inline-flex items-center rounded-full bg-[#D85C5C]/15 text-[#A83838] font-medium ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-[#D85C5C]" />
          Rejected
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-700 font-medium ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
