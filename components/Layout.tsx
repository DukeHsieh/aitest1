import React from 'react';
import { BrainCircuit } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/5">
          <div className="p-2 bg-blue-500 rounded-lg">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            AI 知識測驗 <span className="text-blue-300 font-normal text-sm ml-2">管理幹部版</span>
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {children}
        </div>
      </div>
      <footer className="mt-6 text-slate-400 text-sm text-center">
        技術支援：Google Gemini 3 Flash & React
      </footer>
    </div>
  );
};