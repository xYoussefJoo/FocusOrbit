import { cn } from '@/lib/utils';
import React from 'react';

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 w-full",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-[1.5rem] group/bento hover:shadow-2xl transition duration-500 bg-surface-low p-6 flex flex-col space-y-4 hover:bg-surface-high relative overflow-hidden",
        className
      )}
    >
      <div className="flex-1 w-full min-h-[12rem] flex items-center justify-center rounded-xl bg-surface/50 border border-surface-high/20 overflow-hidden">
        {header}
      </div>
      <div className="group-hover/bento:-translate-y-1 transition duration-200 pt-2">
        <div className="text-primary-container mb-3">{icon}</div>
        <h3 className="font-bold text-lg text-white mb-2">
          {title}
        </h3>
        <p className="font-normal text-on-surface-variant text-sm pr-4">
          {description}
        </p>
      </div>
    </div>
  );
};
