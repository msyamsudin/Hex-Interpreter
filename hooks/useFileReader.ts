import { AnalyzedFile } from '../types';
import { MAX_FILE_SIZE } from '../constants';

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
};

export const processFiles = async (filesToProcess: FileList): Promise<[AnalyzedFile[], string | null]> => {
    const filesArray = Array.from(filesToProcess);
    const newFiles: AnalyzedFile[] = [];
    let error: string | null = null;
    
    const totalSize = filesArray.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_FILE_SIZE * 10) { // 50 MB total limit
         error = `Total file size is too large. Maximum is ${(MAX_FILE_SIZE * 10) / 1024 / 1024}MB.`;
         return [[], error];
    }

    for (const file of filesArray) {
        if (file.size > MAX_FILE_SIZE) {
            console.warn(`Skipping large file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            if (!error) error = `Skipped files larger than ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
            continue;
        }

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            newFiles.push({
                id: crypto.randomUUID(),
                fileInfo: { name: file.name, size: file.size },
                bytes: new Uint8Array(arrayBuffer),
            });
        } catch (e) {
            console.error("Failed to read file:", file.name, e);
            error = `Failed to read the file: ${file.name}.`;
            // Stop processing further files if one fails, to avoid partial state
            break;
        }
    }

    return [newFiles, error];
};
