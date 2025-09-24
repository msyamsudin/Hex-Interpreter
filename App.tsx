
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { interpret } from './services/hexInterpreter';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { DEBOUNCE_DELAY } from './constants';
import { FileDropzone } from './components/FileDropzone';
import { DataInspector } from './components/DataInspector';
import { HexTextView } from './components/HexTextView';
import { MainLayout } from './components/MainLayout';
import { useFileAnalysisManager } from './hooks/useFileAnalysisManager';

const App: React.FC = () => {
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
