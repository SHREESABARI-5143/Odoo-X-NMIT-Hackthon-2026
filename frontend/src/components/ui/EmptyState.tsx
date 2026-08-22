import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-[#E7E4E1] my-4">
      <div className="p-3 bg-[#FFF1E2] rounded-full text-[#714B67] mb-3">
        {icon || <Inbox className="w-6 h-6 text-[#714B67]" />}
      </div>
      <h4 className="text-base font-semibold text-[#252525]">{title}</h4>
      {description && <p className="text-xs text-[#6B6B6B] mt-1 max-w-sm">{description}</p>}
      {actionText && onAction && (
        <Button size="sm" className="mt-4" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
