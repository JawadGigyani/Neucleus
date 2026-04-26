"use client";

import { ReactNode } from "react";

export function Tooltip({ children, text }: { children: ReactNode; text: string }) {
  return (
    <div className="relative group/tip inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tip:block z-50 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-[240px] shadow-lg leading-relaxed whitespace-normal text-center">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    </div>
  );
}
