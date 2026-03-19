'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TermInfoIconProps {
    term: string;
    className?: string;
}

export default function TermInfoIcon({ term, className = '' }: TermInfoIconProps) {
    const [showPopup, setShowPopup] = useState(false);
    const { getTermInfo } = useLanguage();

    const termInfo = getTermInfo(term);

    if (!termInfo) {
        return null;
    }

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={() => setShowPopup(!showPopup)}
                onMouseEnter={() => setShowPopup(true)}
                onMouseLeave={() => setShowPopup(false)}
                className={`inline-flex items-center justify-center ${className}`}
                aria-label={`Thông tin về ${term}`}
            >
                <Info className="h-3 w-3 text-blue-500 hover:text-blue-600" />
            </button>

            {showPopup && (
                <div className="absolute z-50 w-64 p-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg left-1/2 transform -translate-x-1/2">
                    <div className="text-sm">
                        <div className="font-semibold text-gray-900 mb-1">{termInfo.term}</div>
                        <div className="text-gray-600">{termInfo.description}</div>
                    </div>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border-t border-l border-gray-200 rotate-45"></div>
                </div>
            )}
        </div>
    );
}