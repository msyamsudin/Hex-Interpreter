
import React, { DragEvent, useCallback, useRef, useState } from 'react';
import { AnalyzedFile, CrossFileAnalysisResult, InterpretationResults, AiProvider } from '../types';
import { LoadingIcon, FilePlusIcon, AlertTriangleIcon, ChevronDownIcon, ChevronUpIcon, FileIcon, LinkIcon } from './icons';
import { InterpretationPanel } from './InterpretationPanel';
import { FileListItem } from './FileListItem';

interface DataInspectorProps {
    files: AnalyzedFile[];
    activeFile: AnalyzedFile | null;
    onFileSelect: (fileId: string) => void;
    onFileRemove: (fileId: string) => void;
    onReset: () => void;
    onFilesAppended: (files: FileList) => void;
    crossFileResult: CrossFileAnalysisResult | null;
    isCrossAnalyzing: boolean;
    crossFileError: string | null;
    onRunAnalysis: () => void;
    aiProvider: AiProvider;
    setAiProvider: (provider: AiProvider) => void;
    interpretationResults: InterpretationResults | null;
    endianness: 'little' | 'big';
    setEndianness: (endianness: 'little' | 'big') => void;
    isInspectorVisible: boolean;
    setIsInspectorVisible: (visible: boolean) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode, isCollapsible?: boolean, isOpen?: boolean, onToggle?: () => void }> = ({ title, children, isCollapsible, isOpen, onToggle }) => (
    <div className="border-t border-slate-800 py-3">
        <h3 
            className={`text-sm font-semibold text-red-500 uppercase tracking-wider mb-2 px-2 flex justify-between items-center ${isCollapsible ? 'cursor-pointer' : ''}`}
            onClick={onToggle}
        >
            {title}
            {isCollapsible && (isOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />)}
        </h3>
        <div className="px-2">{children}</div>
    </div>
);

const InspectorRow: React.FC<{ label: string; value: string; isMono?: boolean }> = ({ label, value, isMono = false }) => (
    <div className="grid grid-cols-2 items-center py-1.5 px-2 rounded-md hover:bg-slate-800/50">
        <span className="text-slate-400 truncate">{label}</span>
        <span className={`text-right text-slate-200 truncate ${isMono ? 'font-mono' : ''}`}>{value}</span>
    </div>
);

const AppendFileZone: React.FC<{ onFilesAppended: (files: FileList) => void }> = ({ onFilesAppended }) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }, []);
    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files?.length) {
            onFilesAppended(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }, [onFilesAppended]);
    
    const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) onFilesAppended(e.target.files);
      e.target.value = '';
    };

    const handleZoneClick = () => fileInputRef.current?.click();

    return (
        <div className="px-2 mt-2">
            <input type="file" ref={fileInputRef} onChange={handleFileSelectChange} className="hidden" aria-hidden="true" multiple />
            <div
                onClick={handleZoneClick}
                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                role="button" aria-label="Add more files"
                className={`flex items-center justify-center space-x-2 p-3 border-2 border-dashed rounded-md cursor-pointer transition-colors duration-200
                ${isDragging ? 'border-red-500 bg-slate-800/50' : 'border-slate-700 hover:border-slate-500'}`}
            >
                <FilePlusIcon className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500">Add files...</span>
            </div>
        </div>
    );
}


export const DataInspector: React.FC<DataInspectorProps> = ({ 
    files, activeFile, onFileSelect, onFileRemove, onReset, onFilesAppended,
    crossFileResult, isCrossAnalyzing, crossFileError, onRunAnalysis,
    aiProvider, setAiProvider,
    interpretationResults, endianness, setEndianness, 
    isInspectorVisible, setIsInspectorVisible
}) => {
    return (
        <div className="h-full bg-black p-1 text-xs overflow-y-auto flex flex-col">
            <div className="p-2">
                <button 
                    onClick={onReset}
                    className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500"
                >
                    <FilePlusIcon className="w-4 h-4" />
                    <span>New Analysis</span>
                </button>
            </div>
            
            <div className="border-y border-slate-800 py-3">
                <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2 px-2">Loaded Files</h3>
                <div className="space-y-1 px-2">
                    {files.map(file => (
                       <FileListItem
                           key={file.id}
                           file={file}
                           isActive={activeFile?.id === file.id}
                           onSelect={onFileSelect}
                           onRemove={onFileRemove}
                       />
                    ))}
                </div>
                <AppendFileZone onFilesAppended={onFilesAppended} />
            </div>

            <Section title="Analysis">
                <button
                    onClick={onRunAnalysis}
                    disabled={isCrossAnalyzing}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCrossAnalyzing ? <LoadingIcon className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                    <span>{files.length > 1 ? 'Analyze Relationships' : 'Analyze File'}</span>
                </button>
                <div className="mt-3 text-slate-300">
                    {crossFileError && (
                        <div className="bg-red-900/40 border border-red-500/30 text-red-300 rounded-md p-3 flex items-start space-x-3">
                            <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
                            <p className="font-sans">{crossFileError}</p>
                        </div>
                    )}
                    {crossFileResult && (
                        <div className="space-y-2 p-3 bg-slate-800/50 rounded-md">
                           <p className={`font-semibold text-lg ${crossFileResult.related ? 'text-green-400' : 'text-amber-400'}`}>
                                {crossFileResult.relationship}
                           </p>
                           <p className="text-slate-400 font-sans">{crossFileResult.reasoning}</p>
                        </div>
                    )}
                </div>
            </Section>

            {activeFile && (
                <>
                    <Section title="File Information">
                        <InspectorRow label="Name" value={activeFile.fileInfo.name} />
                        <InspectorRow label="Size" value={`${activeFile.fileInfo.size} bytes`} isMono />
                    </Section>
                    
                    <div className="border-t border-slate-800 py-3">
                        <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2 px-2 flex justify-between items-center">
                            <span>AI Analysis</span>
                            <div className="flex items-center space-x-1 text-slate-200 bg-slate-800 p-1 rounded-md">
                                <button onClick={() => setAiProvider('gemini')} className={`px-2 py-1 text-xs rounded transition-colors ${aiProvider === 'gemini' ? 'bg-red-600 text-white' : 'hover:bg-slate-700'}`}>Gemini</button>
                                <button onClick={() => setAiProvider('openai')} className={`px-2 py-1 text-xs rounded transition-colors ${aiProvider === 'openai' ? 'bg-red-600 text-white' : 'hover:bg-slate-700'}`}>OpenAI</button>
                            </div>
                        </h3>
                        <div className="px-2">
                             <div className="py-1.5 text-slate-300">
                                {activeFile.aiAnalysis?.error && (
                                    <div className="bg-red-900/40 border border-red-500/30 text-red-300 rounded-md p-3 flex items-start space-x-3">
                                        <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
                                        <p className="font-sans">{activeFile.aiAnalysis.error}</p>
                                    </div>
                                )}
                                {activeFile.aiAnalysis?.isLoading && (
                                    <div className="flex items-center space-x-2 text-slate-400 italic">
                                        <LoadingIcon className="w-4 h-4 animate-spin" />
                                        <span>Analyzing file...</span>
                                    </div>
                                )}
                                {activeFile.aiAnalysis?.result && (
                                    <div className="font-sans text-slate-300 space-y-3">
                                        <div>
                                            <p className="font-semibold text-slate-100">{activeFile.aiAnalysis.result.fileType}</p>
                                            <p className="text-slate-400 mt-1">{activeFile.aiAnalysis.result.summary}</p>
                                        </div>
                                        {activeFile.aiAnalysis.result.findings?.length > 0 && (
                                            <div>
                                                <p className="font-semibold text-slate-100 mb-2">Notable Findings:</p>
                                                <ul className="space-y-1.5">
                                                    {activeFile.aiAnalysis.result.findings.map((finding, index) => (
                                                       <li key={index} className="flex items-start">
                                                           <span className="text-red-500 mr-2 mt-0.5">&#8227;</span>
                                                           <span className="flex-1 text-slate-400 break-words">{finding}</span>
                                                       </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                                 {!activeFile.aiAnalysis && !activeFile.aiAnalysis?.isLoading && (
                                    <div className="text-slate-500 italic text-center py-4">
                                        Click the 'Analyze' button above to get AI insights.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Section title="Data Inspector" isCollapsible isOpen={isInspectorVisible} onToggle={() => setIsInspectorVisible(!isInspectorVisible)}>
                        {isInspectorVisible && (
                           <InterpretationPanel 
                                results={interpretationResults}
                                endianness={endianness}
                                setEndianness={setEndianness}
                           />
                        )}
                    </Section>
                </>
            )}
        </div>
    );
};
