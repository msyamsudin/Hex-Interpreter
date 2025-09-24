import { InterpretationResults } from '../types';

const NA = 'N/A';
const OOB = 'Out of Bounds';

const safeRead = <T>(
    dataView: DataView,
    offset: number,
    byteLength: number,
    read: () => T,
    format: (val: T) => string = (v) => String(v)
): string => {
    if (offset + byteLength > dataView.byteLength) {
        return OOB;
    }
    try {
        const value = read();
        return format(value);
    } catch (e) {
        return e instanceof Error ? e.message : 'Error';
    }
};

// --- Integer Decoders ---
const getInt = (dv: DataView, off: number, len: number, signed: boolean, isLE: boolean) => {
    switch(len) {
        case 1: return signed ? dv.getInt8(off) : dv.getUint8(off);
        case 2: return signed ? dv.getInt16(off, isLE) : dv.getUint16(off, isLE);
        case 4: return signed ? dv.getInt32(off, isLE) : dv.getUint32(off, isLE);
        case 8: return signed ? dv.getBigInt64(off, isLE) : dv.getBigUint64(off, isLE);
        default: throw new Error("Invalid integer length");
    }
}
const getUint24 = (dv: DataView, off: number, isLE: boolean) => {
    const b1 = dv.getUint8(off);
    const b2 = dv.getUint8(off + 1);
    const b3 = dv.getUint8(off + 2);
    return isLE ? b1 | (b2 << 8) | (b3 << 16) : (b1 << 16) | (b2 << 8) | b3;
}
const getInt24 = (dv: DataView, off: number, isLE: boolean) => {
    let val = getUint24(dv, off, isLE);
    if (val & 0x800000) { // check sign bit
        val = val - 0x1000000;
    }
    return val;
}

// --- LEB128 Decoder ---
const decodeLeb128 = (bytes: Uint8Array, offset: number, signed: boolean): { value: bigint, length: number } | { error: string } => {
    let result = 0n;
    let shift = 0n;
    let i = offset;
    let byte;

    if (i >= bytes.length) return { error: OOB };

    while (true) {
        if (i >= bytes.length) return { error: "Incomplete LEB128 sequence" };
        byte = bytes[i];
        i++;
        result |= (BigInt(byte & 0x7f)) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7n;
        if (shift > 63n) return { error: "LEB128 sequence too long" };
    }

    if (signed && (byte & 0x40) !== 0) {
        result |= -(1n << shift << 7n);
    }

    return { value: result, length: i - offset };
}


// --- DateTime Decoders ---
const decodeMsDosDateTime = (dv: DataView, off: number, isLE: boolean) => {
    const dateVal = dv.getUint16(off + 2, isLE);
    const timeVal = dv.getUint16(off, isLE);

    const year = ((dateVal >> 9) & 0x7F) + 1980;
    const month = ((dateVal >> 5) & 0x0F);
    const day = dateVal & 0x1F;
    const hours = (timeVal >> 11) & 0x1F;
    const minutes = (timeVal >> 5) & 0x3F;
    const seconds = (timeVal & 0x1F) * 2;
    
    if (month === 0 || day === 0) return "Invalid date";
    
    try {
      return new Date(year, month - 1, day, hours, minutes, seconds).toUTCString();
    } catch {
      return "Invalid date";
    }
}

const decodeOleDateTime = (dv: DataView, off: number, isLE: boolean) => {
    const oleTime = dv.getFloat64(off, isLE);
    if (isNaN(oleTime)) return "Invalid date";
    // OLE Automation date is the number of days since 1899-12-30 00:00:00
    const baseDate = new Date('1899-12-30T00:00:00Z');
    const milliseconds = oleTime * 24 * 60 * 60 * 1000;
    return new Date(baseDate.getTime() + milliseconds).toUTCString();
}

const decodeUnix32DateTime = (dv: DataView, off: number, isLE: boolean) => {
    const seconds = dv.getUint32(off, isLE);
    return new Date(seconds * 1000).toUTCString();
}

const decodeMacHfsDateTime = (dv: DataView, off: number, isLE: boolean) => {
    const seconds = dv.getUint32(off, !isLE); // HFS is Big Endian
     // Mac HFS epoch is 1904-01-01 00:00:00 UTC
    const macEpoch = Date.UTC(1904, 0, 1, 0, 0, 0);
    return new Date(macEpoch + seconds * 1000).toUTCString();
}

export function interpret(bytes: Uint8Array, offset: number, isLittleEndian: boolean): InterpretationResults {
    const dataView = new DataView(bytes.buffer);
    const remainingBytes = bytes.slice(offset);

    const lebU = decodeLeb128(bytes, offset, false);
    const lebI = decodeLeb128(bytes, offset, true);

    return {
        integers: {
            u8: safeRead(dataView, offset, 1, () => getInt(dataView, offset, 1, false, isLittleEndian)),
            i8: safeRead(dataView, offset, 1, () => getInt(dataView, offset, 1, true, isLittleEndian)),
            u16: safeRead(dataView, offset, 2, () => getInt(dataView, offset, 2, false, isLittleEndian)),
            i16: safeRead(dataView, offset, 2, () => getInt(dataView, offset, 2, true, isLittleEndian)),
            u24: safeRead(dataView, offset, 3, () => getUint24(dataView, offset, isLittleEndian)),
            i24: safeRead(dataView, offset, 3, () => getInt24(dataView, offset, isLittleEndian)),
            u32: safeRead(dataView, offset, 4, () => getInt(dataView, offset, 4, false, isLittleEndian)),
            i32: safeRead(dataView, offset, 4, () => getInt(dataView, offset, 4, true, isLittleEndian)),
            u64: safeRead(dataView, offset, 8, () => getInt(dataView, offset, 8, false, isLittleEndian)),
            i64: safeRead(dataView, offset, 8, () => getInt(dataView, offset, 8, true, isLittleEndian)),
        },
        floats: {
            f16: NA, // 16-bit float is complex and not standard in DataView
            f32: safeRead(dataView, offset, 4, () => dataView.getFloat32(offset, isLittleEndian)),
            f64: safeRead(dataView, offset, 8, () => dataView.getFloat64(offset, isLittleEndian)),
        },
        leb128: {
            u: 'error' in lebU ? lebU.error : `${lebU.value} (${lebU.length} bytes)`,
            i: 'error' in lebI ? lebI.error : `${lebI.value} (${lebI.length} bytes)`,
        },
        dates: {
            msDos: safeRead(dataView, offset, 4, () => decodeMsDosDateTime(dataView, offset, isLittleEndian)),
            ole: safeRead(dataView, offset, 8, () => decodeOleDateTime(dataView, offset, isLittleEndian)),
            unix32: safeRead(dataView, offset, 4, () => decodeUnix32DateTime(dataView, offset, isLittleEndian)),
            macHfs: safeRead(dataView, offset, 4, () => decodeMacHfsDateTime(dataView, offset, isLittleEndian)),
        },
        text: {
            utf8: safeRead(dataView, offset, 1, () => new TextDecoder('utf-8', {fatal: true}).decode(remainingBytes.slice(0, Math.min(64, remainingBytes.length))), v => v.split('\n')[0].replace(/\p{C}/gu, '.'))
        },
        binary: safeRead(dataView, offset, 1, () => dataView.getUint8(offset).toString(2).padStart(8, '0')),
    };
}