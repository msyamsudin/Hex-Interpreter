import React, { useState, useRef, useCallback, DragEvent } from 'react';
import { FileUploadIcon } from './icons';

interface InputAreaProps {
  rawHex: string;
  setRawHex: (value: string) => void;
  error: string | null;
  byteCount: number;
  onFileSelected: (file: File) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ rawHex, setRawHex, error, byteCount, onFileSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setRawHex('');
  };

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onFileSelected]);

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="relative">
        <label htmlFor="hex-input" className="block text-sm font-medium text-slate-300 mb-2">
          Hexadecimal Input
        </label>
        <textarea
          id="hex-input"
          value={rawHex}
          onChange={(e) => setRawHex(e.target.value)}
          placeholder="Paste hex data here or use the file upload area below..."
          className={`w-full h-36 p-4 font-mono text-slate-200 bg-slate-800 border rounded-lg shadow-inner transition-colors duration-200 focus:outline-none focus:ring-2 resize-y ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-cyan-500'
          }`}
        />
        {rawHex && (
          <button
              onClick={handleClear}
              className="absolute top-9 right-3 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Clear input"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <div className="h-5 mt-2 flex justify-between items-center text-sm">
          {error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            <p className="text-slate-400">{byteCount} bytes</p>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <div
          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
            ${isDragging ? 'border-cyan-400 bg-slate-800/50' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'}`}
          onClick={handleZoneClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          role="button"
          aria-label="File upload area"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelectChange}
            className="hidden"
            aria-hidden="true"
          />
          <FileUploadIcon className="w-8 h-8 text-slate-500 mb-2" />
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop a file
          </p>
          <p className="text-xs text-slate-500 mt-1">
            File contents will be loaded as hexadecimal.
          </p>
        </div>
      </div>
    </div>
  );
};
