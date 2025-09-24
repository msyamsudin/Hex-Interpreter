
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { BYTES_PER_LINE, VIRTUAL_ROW_HEIGHT } from '../constants';

interface HexTextViewProps {
    bytes: Uint8Array | null;
    selectedOffset: number;
    onOffsetChange: (offset: number) => void;
}

const MemoizedRow = React.memo(({ line, selectedOffset, onOffsetChange, style }: {
    line: { offset: number, hex: string[], ascii: string };
    selectedOffset: number;
    onOffsetChange: (offset: number) => void;
    style: React.CSSProperties;
}) => {
    return (
        <div style={style} className="flex items-center whitespace-nowrap absolute top-0 left-0 right-0">
            <span className="text-slate-500 w-24 flex-shrink-0">{line.offset.toString(16).padStart(8, '0').toUpperCase()}</span>
            <div className="flex-1 flex gap-x-1 ml-4">
                {line.hex.map((hex, i) => {
                    const currentOffset = line.offset + i;
                    const isSelected = currentOffset === selectedOffset;
                    return (
                        <span
                            key={currentOffset}
                            onClick={() => onOffsetChange(currentOffset)}
                            className={`w-6 text-center rounded cursor-pointer ${isSelected ? 'bg-red-600 text-white' : 'hover:bg-slate-700'}`}
                        >
                            {hex}
                        </span>
                    );
                })}
            </div>
            <span className="text-slate-400 w-48 ml-4 flex-shrink-0 tracking-widest">{line.ascii}</span>
        </div>
    );
});


export const HexTextView: React.FC<HexTextViewProps> = ({ bytes, selectedOffset, onOffsetChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    const lines = useMemo(() => {
        if (!bytes) return [];
        const result: { offset: number, hex: string[], ascii: string }[] = [];
        for (let i = 0; i < bytes.length; i += BYTES_PER_LINE) {
            const chunk = bytes.slice(i, i + BYTES_PER_LINE);
            // FIX: Explicitly cast byte to number to resolve type inference issues.
            const hex = Array.from(chunk).map(byte => (byte as number).toString(16).padStart(2, '0').toUpperCase());
            const ascii = Array.from(chunk).map(byte => {
                const numByte = byte as number;
                return (numByte >= 32 && numByte <= 126) ? String.fromCharCode(numByte) : '.';
            }).join('');
            result.push({ offset: i, hex, ascii });
        }
        return result;
    }, [bytes]);

    useEffect(() => {
        if (!bytes) return;
        if (containerRef.current) {
            const lineIndex = Math.floor(selectedOffset / BYTES_PER_LINE);
            const targetScrollTop = lineIndex * VIRTUAL_ROW_HEIGHT;
            
            const { scrollTop, clientHeight } = containerRef.current;
            
            if (targetScrollTop < scrollTop || targetScrollTop >= scrollTop + clientHeight) {
                 containerRef.current.scrollTop = targetScrollTop;
            }
        }
    }, [selectedOffset, bytes]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    if (!bytes) {
        return (
            <div className="h-full flex items-center justify-center bg-black">
                <p className="text-slate-500 font-sans">Select a file from the sidebar to view its content.</p>
            </div>
        );
    }

    const totalHeight = lines.length * VIRTUAL_ROW_HEIGHT;
    const containerHeight = containerRef.current?.clientHeight || 0;
    
    const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - 5);
    const endIndex = Math.min(lines.length, Math.ceil((scrollTop + containerHeight) / VIRTUAL_ROW_HEIGHT) + 5);

    const visibleLines = lines.slice(startIndex, endIndex);
    
    return (
        <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto p-4 text-sm bg-black font-mono relative"
        >
            <div style={{ height: `${totalHeight}px` }} className="relative w-full">
                {visibleLines.map((line, index) => (
                   <MemoizedRow
                        key={line.offset}
                        line={line}
                        selectedOffset={selectedOffset}
                        onOffsetChange={onOffsetChange}
                        style={{
                           height: `${VIRTUAL_ROW_HEIGHT}px`,
                           transform: `translateY(${ (startIndex + index) * VIRTUAL_ROW_HEIGHT}px)`,
                           lineHeight: `${VIRTUAL_ROW_HEIGHT}px`,
                        }}
                   />
                ))}
            </div>
        </div>
    );
};
