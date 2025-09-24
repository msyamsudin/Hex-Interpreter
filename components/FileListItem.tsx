
import React from 'react';
import { AnalyzedFile } from '../types';
import { FileIcon, LoadingIcon, CheckIcon, AlertTriangleIcon, XIcon } from './icons';

interface FileListItemProps {
    file: AnalyzedFile;
    isActive: boolean;
    onSelect: (fileId: string) => void;
    onRemove: (fileId: string) => void;
}

const FileListItemComponent: React.FC<FileListItemProps> = ({ file, isActive, onSelect, onRemove }) => {
    return (
        <div className={`group w-full flex items-center space-x-2 rounded-md transition-colors ${isActive ? 'bg-slate-700' : 'hover:bg-slate-800'}`}>
            <button 
                onClick={() => onSelect(file.id)}
                className="flex-1 text-left flex items-center space-x-2 p-2"
                aria-current={isActive ? 'page' : undefined}
            >
                <FileIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 truncate">
                    <p className="text-slate-200 truncate">{file.fileInfo.name}</p>
                    <p className="text-slate-500 font-mono text-xs">{file.fileInfo.size} bytes</p>
                </div>
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.id);
                }}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-600 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
                aria-label={`Remove ${file.fileInfo.name}`}
            >
                <XIcon className="w-4 h-4" />
            </button>
            <div className="pr-3 flex items-center justify-center w-10">
                {file.aiAnalysis?.isLoading ? (
                    <LoadingIcon className="w-4 h-4 animate-spin text-slate-400" title="Analyzing..." />
                ) : file.aiAnalysis?.result && !file.aiAnalysis.error ? (
                    <CheckIcon className="w-5 h-5 text-green-500" title="Analysis Complete" />
                ) : file.aiAnalysis?.error ? (
                    <AlertTriangleIcon className="w-4 h-4 text-amber-500" title={`Failed: ${file.aiAnalysis.error}`} />
                ) : null}
            </div>
        </div>
    );
};

export const FileListItem = React.memo(FileListItemComponent);
