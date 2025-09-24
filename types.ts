
export interface FileInfo {
  name: string;
  size: number;
}

export interface AiAnalysisResult {
  fileType: string;
  summary: string;
  findings: string[];
}

export interface CrossFileAnalysisResult {
    related: boolean;
    relationship: string;
    reasoning: string;
}

export interface AnalyzedFile {
    id: string;
    fileInfo: FileInfo;
    bytes: Uint8Array;
    aiAnalysis?: {
        result: AiAnalysisResult | null;
        isLoading: boolean;
        error: string | null;
    }
}

export interface InterpretationResults {
  integers: {
    u8: string; i8: string;
    u16: string; i16: string;
    u24: string; i24: string;
    u32: string; i32: string;
    u64: string; i64: string;
  },
  floats: {
    f16: string; f32: string; f64: string;
  },
  leb128: {
    u: string; i: string;
  },
  dates: {
    msDos: string;
    ole: string;
    unix32: string;
    macHfs: string;
  },
  text: {
    utf8: string;
  },
  binary: string;
}

export type AiProvider = 'gemini' | 'openai' | 'unconfigured';
