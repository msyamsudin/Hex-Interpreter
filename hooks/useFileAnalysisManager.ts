
import { useReducer, useMemo, useCallback, useRef, useEffect } from 'react';
import { AnalyzedFile, AiProvider, CrossFileAnalysisResult, AiAnalysisResult } from '../types';
import { processFiles } from './useFileReader';
import { generateSummary, generateRelationshipAnalysis } from '../services/aiAnalyzer';

// --- State and Action Types ---

interface State {
    allFiles: AnalyzedFile[];
    activeFileId: string | null;
    isReading: boolean;
    fileError: string | null;
    crossFileResult: CrossFileAnalysisResult | null;
    isCrossAnalyzing: boolean;
    crossFileError: string | null;
    aiProvider: AiProvider;
}

type Action =
    | { type: 'START_READING' }
    | { type: 'SET_FILES'; payload: { files: AnalyzedFile[]; error: string | null } }
    | { type: 'APPEND_FILES'; payload: { files: AnalyzedFile[]; error: string | null } }
    | { type: 'SET_ACTIVE_FILE_ID'; payload: string | null }
    | { type: 'REMOVE_FILE'; payload: string }
    | { type: 'RESET' }
    | { type: 'SET_AI_PROVIDER'; payload: AiProvider }
    | { type: 'ANALYSIS_START_SINGLE'; payload: { fileId: string } }
    | { type: 'ANALYSIS_UPDATE_SINGLE'; payload: { fileId: string; result?: AiAnalysisResult; error?: string } }
    | { type: 'ANALYSIS_START_CROSS' }
    | { type: 'ANALYSIS_SET_CROSS_RESULT'; payload: { result?: CrossFileAnalysisResult; error?: string } }
    | { type: 'RESET_CROSS_ANALYSIS' };


// --- Initial State and Reducer ---

const initialState: State = {
    allFiles: [],
    activeFileId: null,
    isReading: false,
    fileError: null,
    crossFileResult: null,
    isCrossAnalyzing: false,
    crossFileError: null,
    aiProvider: 'gemini',
};

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'START_READING':
            return { ...state, isReading: true, fileError: null };
        case 'SET_FILES':
            return {
                ...state,
                isReading: false,
                allFiles: action.payload.files,
                activeFileId: action.payload.files.length > 0 ? action.payload.files[0].id : null,
                fileError: action.payload.error,
            };
        case 'APPEND_FILES':
            return {
                ...state,
                isReading: false,
                allFiles: [...state.allFiles, ...action.payload.files],
                fileError: action.payload.error,
            };
        case 'SET_ACTIVE_FILE_ID':
            return { ...state, activeFileId: action.payload };
        case 'REMOVE_FILE': {
            const fileIdToRemove = action.payload;
            const newFiles = state.allFiles.filter(f => f.id !== fileIdToRemove);
            let newActiveFileId = state.activeFileId;

            if (state.activeFileId === fileIdToRemove) {
                const removedIndex = state.allFiles.findIndex(f => f.id === fileIdToRemove);
                if (newFiles.length === 0) {
                    newActiveFileId = null;
                } else if (removedIndex > 0) {
                    newActiveFileId = newFiles[removedIndex - 1].id;
                } else {
                    newActiveFileId = newFiles[0].id;
                }
            }
            
            const shouldResetCrossAnalysis = newFiles.length <= 1;

            return {
                ...state,
                allFiles: newFiles,
                activeFileId: newActiveFileId,
                crossFileResult: shouldResetCrossAnalysis ? null : state.crossFileResult,
                isCrossAnalyzing: shouldResetCrossAnalysis ? false : state.isCrossAnalyzing,
                crossFileError: shouldResetCrossAnalysis ? null : state.crossFileError,
            };
        }
        case 'RESET':
            return initialState;
        case 'SET_AI_PROVIDER':
            return { ...state, aiProvider: action.payload };
        case 'ANALYSIS_START_SINGLE':
            return {
                ...state,
                allFiles: state.allFiles.map(f =>
                    f.id === action.payload.fileId
                        ? { ...f, aiAnalysis: { isLoading: true, error: null, result: null } }
                        : f
                ),
            };
        case 'ANALYSIS_UPDATE_SINGLE':
            return {
                ...state,
                allFiles: state.allFiles.map(f =>
                    f.id === action.payload.fileId
                        ? {
                              ...f,
                              aiAnalysis: {
                                  isLoading: false,
                                  error: action.payload.error ?? null,
                                  result: action.payload.result ?? null,
                              },
                          }
                        : f
                ),
            };
        case 'ANALYSIS_START_CROSS':
            return { ...state, isCrossAnalyzing: true, crossFileError: null, crossFileResult: null };
        case 'ANALYSIS_SET_CROSS_RESULT':
            return {
                ...state,
                isCrossAnalyzing: false,
                crossFileError: action.payload.error ?? null,
                crossFileResult: action.payload.result ?? null,
            };
        case 'RESET_CROSS_ANALYSIS':
            return {...state, crossFileResult: null, isCrossAnalyzing: false, crossFileError: null };
        default:
            return state;
    }
};

// --- Custom Hook ---

export const useFileAnalysisManager = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const activeAnalysisControllers = useRef(new Map<string, AbortController>()).current;

    useEffect(() => {
        return () => {
            activeAnalysisControllers.forEach(controller => controller.abort('Component unmounting'));
        };
    }, [activeAnalysisControllers]);
    
    const handleFilesSelected = useCallback(async (selectedFiles: FileList | null) => {
        dispatch({ type: 'RESET' });
        if (!selectedFiles) return;
        dispatch({ type: 'START_READING' });
        const [files, error] = await processFiles(selectedFiles);
        dispatch({ type: 'SET_FILES', payload: { files, error } });
    }, []);

    const handleAppendFiles = useCallback(async (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        dispatch({ type: 'RESET_CROSS_ANALYSIS' });
        dispatch({ type: 'START_READING' });
        const [files, error] = await processFiles(selectedFiles);
        dispatch({ type: 'APPEND_FILES', payload: { files, error } });
    }, []);
    
    const runSingleFileAnalysis = useCallback(async (fileId: string, provider: AiProvider) => {
        const fileToAnalyze = state.allFiles.find(f => f.id === fileId);
        if (!fileToAnalyze) return false;

        activeAnalysisControllers.get(fileId)?.abort('Starting new analysis');
        const controller = new AbortController();
        activeAnalysisControllers.set(fileId, controller);

        dispatch({ type: 'ANALYSIS_START_SINGLE', payload: { fileId } });

        try {
            const result = await generateSummary(provider, fileToAnalyze.bytes, controller.signal);
            if (controller.signal.aborted) return false;
            dispatch({ type: 'ANALYSIS_UPDATE_SINGLE', payload: { fileId, result } });
            return true;
        } catch (error) {
            if (controller.signal.aborted) return false;
            console.error("Error generating summary:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            dispatch({ type: 'ANALYSIS_UPDATE_SINGLE', payload: { fileId, error: errorMessage } });
            return false;
        } finally {
            activeAnalysisControllers.delete(fileId);
        }
    }, [state.allFiles, activeAnalysisControllers]);

    const runCrossFileAnalysis = useCallback(async () => {
        const summaries = state.allFiles
            .map(f => {
                const result = f.aiAnalysis?.result;
                // Use safe navigation and provide defaults
                return result ? {
                    fileName: f.fileInfo.name,
                    fileType: result.fileType ?? 'Unknown',
                    summary: result.summary ?? ''
                } : null;
            })
            .filter((f): f is { fileName: string; fileType: string; summary: string; } => f !== null); // Type guard
        
        if (summaries.length < state.allFiles.length) {
            dispatch({ type: 'ANALYSIS_SET_CROSS_RESULT', payload: { error: "One or more files have not been analyzed successfully." } });
            return;
        }

        dispatch({ type: 'ANALYSIS_START_CROSS' });
        try {
            const result = await generateRelationshipAnalysis(summaries);
            dispatch({ type: 'ANALYSIS_SET_CROSS_RESULT', payload: { result } });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            dispatch({ type: 'ANALYSIS_SET_CROSS_RESULT', payload: { error: `Analysis Failed: ${errorMessage}` } });
        }
    }, [state.allFiles]);
    
    const handleRunAnalysis = useCallback(async () => {
        dispatch({ type: 'RESET_CROSS_ANALYSIS' });

        const filesNeedingAnalysis = state.allFiles.filter(f => !f.aiAnalysis?.result || f.aiAnalysis.error);
        
        dispatch({ type: 'ANALYSIS_START_CROSS' }); // Set loading state for the whole process
        const analysisPromises = filesNeedingAnalysis.map(file => runSingleFileAnalysis(file.id, state.aiProvider));
        const results = await Promise.all(analysisPromises);
        
        // After single analyses, if there are multiple files, run cross-analysis
        if (state.allFiles.length > 1) {
            // Check if any single analysis failed
            if (results.some(success => !success) || state.allFiles.some(f => f.aiAnalysis?.error)) {
                 dispatch({ type: 'ANALYSIS_SET_CROSS_RESULT', payload: { error: "Could not analyze relationships because one or more files failed analysis." } });
            } else {
                await runCrossFileAnalysis();
            }
        } else {
             dispatch({ type: 'ANALYSIS_SET_CROSS_RESULT', payload: {} }); // Just stop loading
        }
    }, [state.allFiles, state.aiProvider, runSingleFileAnalysis, runCrossFileAnalysis]);
    

    const actions = useMemo(() => ({
        handleFilesSelected,
        handleAppendFiles,
        setActiveFileId: (id: string) => dispatch({ type: 'SET_ACTIVE_FILE_ID', payload: id }),
        handleRemoveFile: (id: string) => dispatch({ type: 'REMOVE_FILE', payload: id }),
        reset: () => dispatch({ type: 'RESET' }),
        setAiProvider: (provider: AiProvider) => dispatch({ type: 'SET_AI_PROVIDER', payload: provider }),
        handleRunAnalysis
    }), [handleFilesSelected, handleAppendFiles, handleRunAnalysis]);

    return { state, actions };
};
