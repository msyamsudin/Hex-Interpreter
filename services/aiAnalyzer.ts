
import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult, AiProvider, CrossFileAnalysisResult } from "../types";
import { BYTES_PER_LINE } from "../constants";

// --- Constants ---
const AI_SAMPLE_SIZE = 512;

// --- Initialize AI Client ---
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// --- Helper Functions ---
const formatBytesForPrompt = (bytes: Uint8Array): string => {
    const lines = [];
    for (let i = 0; i < bytes.length; i += BYTES_PER_LINE) {
        const chunk = bytes.slice(i, i + BYTES_PER_LINE);
        const hex = Array.from(chunk).map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        lines.push(`${i.toString(16).padStart(8, '0').toUpperCase()}: ${hex}`);
    }
    return lines.join('\n');
}

// --- AI Response Schema ---
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        fileType: { type: Type.STRING, description: "Jenis file yang terdeteksi (misalnya, 'Gambar PNG', 'Teks Biasa UTF-8')." },
        summary: { type: Type.STRING, description: "Ringkasan singkat tentang tujuan atau isi file." },
        findings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Daftar temuan penting yang diekstrak dari data (maksimal 5)."
        },
    },
    required: ["fileType", "summary", "findings"],
};

const relationshipSchema = {
    type: Type.OBJECT,
    properties: {
        related: { type: Type.BOOLEAN, description: "Apakah file-file ini kemungkinan saling terkait?" },
        relationship: { type: Type.STRING, description: "Deskripsi singkat tentang hubungan tersebut (misalnya, 'Bagian dari arsip ZIP', 'File gambar dan metadata-nya', 'Tidak terkait')." },
        reasoning: { type: Type.STRING, description: "Penjelasan mengapa Anda yakin hubungan itu ada atau tidak ada." },
    },
    required: ["related", "relationship", "reasoning"],
};

// --- API Call Functions ---
async function analyzeWithGemini(formattedData: string, signal: AbortSignal): Promise<AiAnalysisResult> {
    const prompt = `Anda adalah seorang analis file forensik. Analisis data heksadesimal berikut dari sebuah file. Respons Anda HARUS berupa objek JSON yang valid. Identifikasi kemungkinan jenis file, berikan ringkasan singkat tentang tujuannya, dan ekstrak hingga 5 temuan penting (seperti string yang dapat dibaca atau pola data yang menarik). Hasil harus dalam bahasa Indonesia.\n\nBerikut datanya:\n\`\`\`\n${formattedData}\n\`\`\``;
    
    // Note: The @google/genai SDK v1 doesn't directly support AbortSignal in generateContent.
    // The request will proceed, but the UI-side logic will discard the result if aborted.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    return JSON.parse(response.text);
}

async function analyzeWithOpenAI(formattedData: string, signal: AbortSignal): Promise<AiAnalysisResult> {
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
        throw new Error("OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.");
    }

    const prompt = `Anda adalah seorang analis file forensik. Analisis data heksadesimal berikut. Respons Anda HARUS berupa objek JSON yang valid dengan tiga kunci: "fileType" (string), "summary" (string), dan "findings" (array of strings). Identifikasi jenis file, berikan ringkasan singkat, dan ekstrak hingga 5 temuan penting. Hasil harus dalam bahasa Indonesia. Berikut datanya:\n\n\`\`\`\n${formattedData}\n\`\`\``;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        signal,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Catch JSON parsing errors
        throw new Error(`OpenAI API Error: ${response.statusText} - ${errorData.error?.message || 'Failed to get error details.'}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

export async function generateRelationshipAnalysis(
    files: { fileName: string; fileType: string; summary: string }[]
): Promise<CrossFileAnalysisResult> {
    if (!process.env.API_KEY) {
        throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
    }
    const fileSummaries = files.map(f => `- File: ${f.fileName}\n  Type: ${f.fileType}\n  Summary: ${f.summary}`).join('\n\n');
    
    const prompt = `Anda adalah seorang analis file forensik. Berdasarkan ringkasan dari beberapa file, tentukan apakah ada kemungkinan hubungan di antara file-file tersebut. Respons Anda HARUS berupa objek JSON yang valid. Hasil harus dalam bahasa Indonesia.\n\nFile untuk analisis:\n${fileSummaries}\n\nApakah file-file ini saling terkait? Jelaskan alasan Anda.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: relationshipSchema,
        },
    });

    return JSON.parse(response.text);
}


// --- Main Service Function ---
export async function generateSummary(provider: AiProvider, bytes: Uint8Array, signal: AbortSignal): Promise<AiAnalysisResult> {
    const sampleBytes = bytes.slice(0, AI_SAMPLE_SIZE);
    const formattedData = formatBytesForPrompt(sampleBytes);
    
    if (provider === 'gemini') {
        if (!process.env.API_KEY) {
            throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
        }
        return analyzeWithGemini(formattedData, signal);
    }
    
    if (provider === 'openai') {
        return analyzeWithOpenAI(formattedData, signal);
    }

    throw new Error("Invalid AI provider specified.");
}