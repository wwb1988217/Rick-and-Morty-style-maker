import React from 'react';

export const LoadingPortal: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="relative w-48 h-48">
        {/* Outer ambient glow */}
        <div className="absolute inset-0 rounded-full bg-lime-500 blur-2xl opacity-20 animate-pulse"></div>
        
        {/* Swirling portal rings */}
        <div className="absolute inset-0 rounded-full border-[6px] border-lime-500/80 border-dashed animate-[spin_8s_linear_infinite]"></div>
        <div className="absolute inset-2 rounded-full border-[5px] border-green-400/80 border-dashed animate-[spin_6s_linear_infinite_reverse]"></div>
        <div className="absolute inset-4 rounded-full border-[4px] border-emerald-500/80 border-dotted animate-[spin_4s_linear_infinite]"></div>
        
        {/* Inner core */}
        <div className="absolute inset-6 rounded-full bg-gradient-radial from-lime-400/20 via-green-900/40 to-transparent blur-sm animate-pulse"></div>
        
        {/* Center vortex */}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-4 h-4 bg-lime-200 rounded-full blur-sm animate-ping"></div>
        </div>
      </div>
      
      <div className="text-center z-10">
        <h2 className="text-3xl font-rick text-lime-400 tracking-wider drop-shadow-[0_0_10px_rgba(163,230,53,0.5)] animate-bounce">
          Wubba Lubba Dub-Dub!
        </h2>
        <p className="text-green-300/80 mt-2 font-mono text-sm">
          Generating dimensions... please wait.
        </p>
      </div>
    </div>
  );
};