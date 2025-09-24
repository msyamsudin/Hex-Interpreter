
import React, { useState, useCallback } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface InterpretationCardProps {
  title: string;
  value: string;
  isMono?: boolean;
}

export const InterpretationCard: React.FC<InterpretationCardProps> = ({ title, value, isMono = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (value && value !== 'N/A') {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex flex-col justify-between relative min-h-[100px]">
      <div>
        <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{title}</h3>
        <p className={`text-slate-200 mt-2 break-words text-lg ${isMono ? 'font-mono' : ''}`}>
          {value}
        </p>
      </div>
      <button
        onClick={handleCopy}
        disabled={!value || value === 'N/A'}
        className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-200"
        aria-label={`Copy ${title}`}
      >
        {copied ? (
          <CheckIcon className="w-4 h-4 text-green-400" />
        ) : (
          <CopyIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};
