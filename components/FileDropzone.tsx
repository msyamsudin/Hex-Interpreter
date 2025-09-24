
import React, { DragEvent, useCallback, useRef, useState } from 'react';
import { FileUploadIcon, LoadingIcon } from './icons';

interface FileDropzoneProps {
    onFilesSelected: (files: FileList) => void;
    isLoading?: boolean;
    error?: string | null;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesSelected, isLoading, error }) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            onFilesSelected(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }, [onFilesSelected]);
    
    const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files);
      }
      e.target.value = '';
    };

    const handleZoneClick = () => {
      if (!isLoading) {
          fileInputRef.current?.click();
      }
    };

    return (
        <div 
            className="w-full h-screen flex flex-col items-center justify-center p-4"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <h1 className="text-5xl font-bold text-slate-200 mb-8 tracking-wider">Hex Interpreter</h1>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelectChange}
                className="hidden"
                aria-hidden="true"
                disabled={isLoading}
                multiple
            />
            <div
              className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg transition-colors duration-200 w-full max-w-2xl h-64
                ${isDragging ? 'border-red-500 bg-slate-800/50' : 'border-slate-600'}
                ${!isLoading ? 'cursor-pointer hover:border-red-700' : 'cursor-not-allowed'}`}
              onClick={handleZoneClick}
              role="button"
            >
                {isLoading ? (
                    <>
                        <LoadingIcon className="w-12 h-12 text-slate-500 mb-4 animate-spin"/>
                        <p className="text-lg text-slate-400">Reading files...</p>
                    </>
                ) : (
                    <>
                        <FileUploadIcon className="w-12 h-12 text-slate-500 mb-4" />
                        <p className="text-lg text-slate-400">
                            <span className="font-semibold text-red-500">Choose files</span> or drag them here
                        </p>
                    </>
                )}
            </div>
            {error && (
                <div className="mt-4 text-center text-red-400 bg-red-900/30 border border-red-500/50 rounded-md px-4 py-2">
                    {error}
                </div>
            )}
        </div>
    );
};
