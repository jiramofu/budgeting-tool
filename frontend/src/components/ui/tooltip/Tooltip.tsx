import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = 250,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-700',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-slate-700',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-slate-700',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-slate-700',
  };

  return (
    <div
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          className={`
            absolute z-50 px-3 py-2 rounded-lg bg-slate-700 text-slate-50 text-sm font-medium
            whitespace-nowrap pointer-events-none ${positionClasses[position]}
            animate-in fade-in duration-200
          `}
          style={{ maxWidth: `${maxWidth}px`, whiteSpace: 'normal' }}
          role="tooltip"
        >
          {content}
          <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
