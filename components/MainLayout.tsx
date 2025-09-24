import React from 'react';
import { SIDEBAR_WIDTH_PX } from '../constants';

interface MainLayoutProps {
    sidebar: React.ReactNode;
    mainContent: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ sidebar, mainContent }) => {
    return (
        <div className="h-screen w-screen flex bg-black">
            <div 
                className="flex-shrink-0 border-r border-slate-800"
                style={{ width: `${SIDEBAR_WIDTH_PX}px` }}
            >
                {sidebar}
            </div>
            <div className="flex-1 min-w-0">
                {mainContent}
            </div>
        </div>
    );
};
