
import React from 'react';
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
}

const ProgressGradient = ({ value, className }: ProgressProps) => {
  return (
    <div className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full w-full flex relative rounded-full overflow-hidden"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse-gradient" />
      </div>
    </div>
  );
};

export default ProgressGradient;
