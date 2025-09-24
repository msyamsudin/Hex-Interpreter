import React from 'react';
import { InterpretationResults } from '../types';

const InspectorRow: React.FC<{ label: string; value: string; isMono?: boolean }> = ({ label, value, isMono = false }) => (
    <div className="grid grid-cols-2 items-center py-1.5 px-2 rounded-md hover:bg-slate-800/50">
        <span className="text-slate-400 truncate">{label}</span>
        <span className={`text-right text-slate-200 truncate ${isMono ? 'font-mono' : ''}`}>{value}</span>
    </div>
);

interface InterpretationPanelProps {
    results: InterpretationResults | null;
    endianness: 'little' | 'big';
    setEndianness: (endianness: 'little' | 'big') => void;
}

const InterpretationPanelComponent: React.FC<InterpretationPanelProps> = ({ results, endianness, setEndianness }) => {
    if (!results) {
        return null;
    }

    return (
        <div>
            <div className="flex items-center justify-between py-1.5 px-2 rounded-md mb-2">
                <span className="text-slate-400">Endianness</span>
                <div className="flex items-center space-x-1 text-slate-200 bg-slate-800 p-1 rounded-md">
                    <button onClick={() => setEndianness('little')} className={`px-2 py-1 text-xs rounded transition-colors ${endianness === 'little' ? 'bg-red-600 text-white' : 'hover:bg-slate-700'}`}>Little</button>
                    <button onClick={() => setEndianness('big')} className={`px-2 py-1 text-xs rounded transition-colors ${endianness === 'big' ? 'bg-red-600 text-white' : 'hover:bg-slate-700'}`}>Big</button>
                </div>
            </div>
            <InspectorRow label="UTF-8 Char" value={results.text.utf8} />
            <InspectorRow label="Binary" value={results.binary} isMono />
            <InspectorRow label="8-bit Unsigned" value={results.integers.u8} isMono/>
            <InspectorRow label="8-bit Signed" value={results.integers.i8} isMono/>
            <InspectorRow label="16-bit Unsigned" value={results.integers.u16} isMono/>
            <InspectorRow label="16-bit Signed" value={results.integers.i16} isMono/>
            <InspectorRow label="24-bit Unsigned" value={results.integers.u24} isMono/>
            <InspectorRow label="24-bit Signed" value={results.integers.i24} isMono/>
            <InspectorRow label="32-bit Unsigned" value={results.integers.u32} isMono/>
            <InspectorRow label="32-bit Signed" value={results.integers.i32} isMono/>
            <InspectorRow label="64-bit Unsigned" value={results.integers.u64} isMono/>
            <InspectorRow label="64-bit Signed" value={results.integers.i64} isMono/>
            <InspectorRow label="Float (16-bit)" value={results.floats.f16} isMono/>
            <InspectorRow label="Float (32-bit)" value={results.floats.f32} isMono/>
            <InspectorRow label="Double (64-bit)" value={results.floats.f64} isMono/>
            <InspectorRow label="LEB128 Unsigned" value={results.leb128.u} isMono/>
            <InspectorRow label="LEB128 Signed" value={results.leb128.i} isMono/>
            <InspectorRow label="MS-DOS DateTime" value={results.dates.msDos}/>
            <InspectorRow label="OLE DateTime" value={results.dates.ole}/>
            <InspectorRow label="Unix 32-bit Time" value={results.dates.unix32}/>
            <InspectorRow label="macOS HFS Time" value={results.dates.macHfs}/>
        </div>
    );
};

export const InterpretationPanel = React.memo(InterpretationPanelComponent);
