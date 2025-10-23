"use client";

import { ReactNode, useState } from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
};

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-black rounded shadow-lg whitespace-nowrap ${positionClasses[side]}`}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-black rotate-45 ${
              side === "top" ? "top-full left-1/2 -translate-x-1/2 -translate-y-1/2" :
              side === "right" ? "right-full top-1/2 -translate-y-1/2 -translate-x-1/2" :
              side === "bottom" ? "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2" :
              "left-full top-1/2 -translate-y-1/2 translate-x-1/2"
            }`}
          />
        </div>
      )}
    </div>
  );
}

type PopoverProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
};

export function Popover({ content, children, side = "top" }: PopoverProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onFocus={() => setIsVisible(true)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`absolute z-50 bg-white border border-border rounded-lg shadow-lg ${positionClasses[side]}`}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-white border-l border-b border-border rotate-45 ${
              side === "top" ? "top-full left-1/2 -translate-x-1/2 -translate-y-1/2" :
              side === "right" ? "right-full top-1/2 -translate-y-1/2 -translate-x-1/2" :
              side === "bottom" ? "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2" :
              "left-full top-1/2 -translate-y-1/2 translate-x-1/2"
            }`}
          />
        </div>
      )}
    </div>
  );
}
