"use client";

import React from 'react';
import { FiLoader } from 'react-icons/fi';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full animate-fade-in-scale">
            <div className="relative">
              
                <div className="w-16 h-16 border-4 border-green-100 border-t-[#325827] rounded-full animate-spin"></div>

              
                <div className="absolute inset-0 flex items-center justify-center">
                    <FiLoader className="w-6 h-6 text-[#325827] animate-pulse" />
                </div>
            </div>

            <div className="mt-6 text-center">
                <h3 className="text-lg font-semibold text-gray-800">Memuat Halaman</h3>
                <p className="text-sm text-gray-500 mt-1">Silakan tunggu sebentar...</p>
            </div>

        
            <div className="flex gap-1.5 mt-4">
                <div className="w-2 h-2 rounded-full bg-[#325827] animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-[#325827] animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-[#325827] animate-bounce"></div>
            </div>
        </div>
    );
};

export default LoadingScreen;
