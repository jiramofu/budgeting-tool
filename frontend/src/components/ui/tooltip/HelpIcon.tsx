import React from 'react';
import { HelpCircle } from 'lucide-react';
import Tooltip from './Tooltip';

interface HelpIconProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const HelpIcon: React.FC<HelpIconProps> = ({ text, position = 'top', className = '' }) => {
  return (
    <Tooltip content={text} position={position}>
      <button
        type="button"
        className={`
          inline-flex items-center justify-center text-slate-400 hover:text-slate-300
          transition-colors cursor-help focus:outline-none focus:ring-2 focus:ring-blue-500
          focus:ring-offset-2 focus:ring-offset-slate-900 rounded ${className}
        `}
        aria-label={`Help: ${text}`}
        tabIndex={0}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </Tooltip>
  );
};

export default HelpIcon;
