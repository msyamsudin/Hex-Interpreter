

import React from 'react';
import { InterpretationResults } from '../types';
import { InterpretationCard } from './InterpretationCard';

interface InterpretationGridProps {
  results: InterpretationResults;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h2 className="text-xl font-bold text-slate-300 mb-4 tracking-tight">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {children}
        </div>
    </div>
);

export const InterpretationGrid: React.FC<InterpretationGridProps> = ({ results }) => {
  return (
    <div className="space-y-10">
      <Section title="Text">
        {/* FIX: Property 'ascii' does not exist on type '{ utf8: string; }'. */}
        <InterpretationCard title="UTF-8" value={results.text.utf8} />
      </Section>

      {/* FIX: Updated to use properties from results.integers, which are not endian-specific in the type. */}
      <Section title="Integers">
        <InterpretationCard title="Unsigned 8-bit" value={results.integers.u8} />
        <InterpretationCard title="Signed 8-bit" value={results.integers.i8} />
        <InterpretationCard title="Unsigned 16-bit" value={results.integers.u16} />
        <InterpretationCard title="Signed 16-bit" value={results.integers.i16} />
        <InterpretationCard title="Unsigned 32-bit" value={results.integers.u32} />
        <InterpretationCard title="Signed 32-bit" value={results.integers.i32} />
        <InterpretationCard title="Unsigned 64-bit" value={results.integers.u64} isMono/>
        <InterpretationCard title="Signed 64-bit" value={results.integers.i64} isMono/>
      </Section>
      
      {/* FIX: Updated to use properties from results.floats, which are not endian-specific in the type. */}
      <Section title="Floating Point">
        <InterpretationCard title="Float 32-bit" value={results.floats.f32} />
        <InterpretationCard title="Double 64-bit" value={results.floats.f64} />
      </Section>
      
      <Section title="Other Formats">
        {/* FIX: Property 'base64' does not exist on type 'InterpretationResults'. */}
        <div className="sm:col-span-2 lg:col-span-4">
            <InterpretationCard title="Binary" value={results.binary} isMono />
        </div>
      </Section>

    </div>
  );
};
