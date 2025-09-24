
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { interpret } from './services/hexInterpreter';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { DEBOUNCE_DELAY } from './constants';
import { FileDropzone } from './components/FileDropzone';
import { DataInspector } from './components/DataInspector';
import { HexTextView } from './components/HexTextView';
import { MainLayout } from './components/MainLayout';
import { useFileAnalysisManager } from './hooks/useFileAnalysisManager';
import { AlertTriangleIcon } from './components/icons';

const ApiKeyErrorScreen: React.FC = () => {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center p-4 bg-black text-slate-300">
            <div className="max-w-2xl w-full bg-slate-900 border border-red-500/30 rounded-lg p-8 text-center shadow-2xl shadow-red-500/10">
                <div className="flex justify-center mb-4">
                    <AlertTriangleIcon className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-red-500 mb-4">API Key Not Configured</h1>
                <p className="text-slate-400 mb-6 font-sans">
                    The Gemini API key is missing. This application requires an API key to use its AI analysis features. Please configure it to continue.
                </p>
                <div className="text-left bg-slate-800 p-4 rounded-md font-mono text-sm">
                    <p className="text-slate-500">// 1. Create a file named .env in the project root</p>
                    <p className="mt-2">
                        <span className="text-cyan-400">API_KEY</span>=<span className="text-amber-400">"YOUR_GEMINI_API_KEY_HERE"</span>
                    </p>
                    <p className="text-slate-500 mt-4">// 2. Restart the development server</p>
                </div>
                <p className="text-xs text-slate-500 mt-6 font-sans">
                    Refer to the <code className="bg-slate-700/50 px-1 py-0.5 rounded">README.md</code> file for more details.
                </p>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    if (!process.env.API_KEY) {
        return <ApiKeyErrorScreen />;
    }

    const { state, actions } = useFileAnalysisManager();
    const { allFiles, activeFileId, isReading, fileError, crossFileResult, isCrossAnalyzing, crossFileError, aiProvider } = state;

    const activeFile = useMemo(() => allFiles.find(f => f.id === activeFileId), [allFiles, activeFileId]);

    const [selectedOffset, setSelectedOffset] = useState<number>(0);
    const debouncedOffset = useDebouncedValue(selectedOffset, DEBOUNCE_DELAY);

    const [endianness, setEndianness] = useState<'little' | 'big'>('little');
    const [isInspectorVisible, setIsInspectorVisible] = useState<boolean>(true);

    const interpretationResults = useMemo(() => {
        if (!activeFile) return null;
        return interpret(activeFile.bytes, debouncedOffset, endianness === 'little');
    }, [activeFile, debouncedOffset, endianness]);
    
    // Memoize actions to prevent unnecessary re-renders in child components
    const handleFileSelect = useCallback((fileId: string) => actions.setActiveFileId(fileId), [actions]);
    const handleReset = useCallback(() => {
        actions.reset();
        setIsInspectorVisible(false);
        setSelectedOffset(0);
    }, [actions]);

    useEffect(() => {
        setSelectedOffset(0);
    }, [activeFileId]);

    if (allFiles.length === 0) {
        return (
            <FileDropzone 
                onFilesSelected={actions.handleFilesSelected} 
                isLoading={isReading}
                error={fileError}
            />
        );
    }

    return (
        <MainLayout
            sidebar={
                <DataInspector 
                    files={allFiles}
                    activeFile={activeFile}
                    onFileSelect={handleFileSelect}
                    onFileRemove={actions.handleRemoveFile}
                    onReset={handleReset}
                    onFilesAppended={actions.handleAppendFiles}
                    
                    crossFileResult={crossFileResult}
                    isCrossAnalyzing={isCrossAnalyzing}
                    crossFileError={crossFileError}
                    onRunAnalysis={actions.handleRunAnalysis}

                    aiProvider={aiProvider}
                    setAiProvider={actions.setAiProvider}
                    
                    interpretationResults={interpretationResults}
                    endianness={endianness}
                    setEndianness={setEndianness}
                    isInspectorVisible={isInspectorVisible}
                    setIsInspectorVisible={setIsInspectorVisible}
                />
            }
            mainContent={
                <HexTextView 
                    bytes={activeFile?.bytes || null} 
                    selectedOffset={selectedOffset} 
                    onOffsetChange={setSelectedOffset} 
                />
            }
        />
    );
}

export default App;
