import React, { useState, useRef } from 'react';
import { AppState, ProcessedImage, GenerationResult } from './types';
import { generateRickAndMortyStyle, StyleStrength } from './services/geminiService';
import { LoadingPortal } from './components/LoadingPortal';

// Simple Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<GenerationResult>({ original: null, generated: null });
  const [error, setError] = useState<string | null>(null);
  const [styleStrength, setStyleStrength] = useState<StyleStrength>('balanced');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, etc.)');
      return;
    }

    try {
      setAppState(AppState.PROCESSING);
      setError(null);

      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API call, but keep full string for display
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        const inputImage: ProcessedImage = {
          base64: base64Data,
          mimeType: mimeType
        };

        // Update state with original image preview immediately
        setResult({ original: inputImage, generated: null });

        try {
          // Call API with selected strength
          const generatedImageUrl = await generateRickAndMortyStyle(inputImage, styleStrength);
          setResult({
            original: inputImage,
            generated: generatedImageUrl
          });
          setAppState(AppState.COMPLETE);
        } catch (err: any) {
          console.error(err);
          // Parse cryptic API errors into user-friendly messages
          let errorMessage = err.message || 'Failed to generate image. Please try again.';
          
          if (typeof errorMessage === 'string') {
            if (errorMessage.includes('Rpc failed') || errorMessage.includes('500') || errorMessage.includes('xhr error')) {
              errorMessage = 'Connection failed. The image might be too complex or large for the portal gun. Try a different photo.';
            } else if (errorMessage.includes('400')) {
              errorMessage = 'The image format wasn\'t accepted by the Council of Ricks. Try a standard JPG or PNG.';
            }
          }
          
          setError(errorMessage);
          setAppState(AppState.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error reading file');
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setResult({ original: null, generated: null });
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (result.generated) {
      const link = document.createElement('a');
      link.href = result.generated;
      link.download = 'rick-and-morty-style.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent relative z-10 font-sans">
      {/* Header */}
      <header className="py-6 px-4 text-center border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <h1 className="text-5xl md:text-6xl font-rick text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Wubba Lubba Dub-Dubify
        </h1>
        <p className="mt-2 text-gray-400 max-w-lg mx-auto">
          Turn your boring reality into a Rick and Morty masterpiece.
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-6 py-3 rounded-lg max-w-md w-full text-center backdrop-blur-sm animate-pulse">
            <span className="font-bold block mb-1">Oh jeez, Rick! Error!</span>
            {error}
            <button 
              onClick={handleReset}
              className="mt-2 text-sm underline hover:text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* State: IDLE */}
        {appState === AppState.IDLE && (
          <div className="w-full max-w-xl space-y-6">
            
            {/* Style Selector */}
            <div className="flex bg-gray-900/60 p-1 rounded-full border border-gray-700 w-fit mx-auto">
              <button
                onClick={() => setStyleStrength('balanced')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  styleStrength === 'balanced' 
                    ? 'bg-gray-700 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Standard Style
              </button>
              <button
                onClick={() => setStyleStrength('strong')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  styleStrength === 'strong' 
                    ? 'bg-lime-600 text-gray-900 shadow-[0_0_15px_rgba(132,204,22,0.5)]' 
                    : 'text-gray-400 hover:text-lime-400'
                }`}
              >
                Max Schwiftiness
              </button>
            </div>

            <div 
              className="border-4 border-dashed border-gray-700 hover:border-lime-500 rounded-3xl p-10 flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur transition-all duration-300 group cursor-pointer h-96 relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-full bg-gray-800 group-hover:bg-lime-900/50 flex items-center justify-center transition-colors mb-6 z-10">
                <div className="text-gray-400 group-hover:text-lime-400 transition-colors">
                  <UploadIcon />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-200 group-hover:text-lime-400 mb-2 z-10">Upload Photo</h3>
              <p className="text-gray-500 text-center max-w-xs group-hover:text-gray-300 z-10">
                Click to select or drag & drop an image to open the portal.
              </p>
              
              {/* Subtle grid animation in background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(132,204,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(132,204,22,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden" 
              />
            </div>

            <div className="text-center text-xs text-gray-500 font-mono">
              {styleStrength === 'strong' 
                ? "Warning: Results may be highly unstable and cartoonish." 
                : "Balanced mode preserves facial features."}
            </div>
          </div>
        )}

        {/* State: PROCESSING */}
        {appState === AppState.PROCESSING && (
          <LoadingPortal />
        )}

        {/* State: COMPLETE or ERROR (with partial result) */}
        {appState === AppState.COMPLETE && result.generated && (
          <div className="w-full max-w-6xl animate-fade-in-up">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              
              {/* Original */}
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-t-lg p-2 text-center border-b border-gray-700">
                  <span className="text-gray-400 font-mono text-sm uppercase tracking-widest">Dimension C-137 (Original)</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700 group">
                   <img 
                    src={`data:${result.original?.mimeType};base64,${result.original?.base64}`} 
                    alt="Original" 
                    className="w-full h-auto object-contain bg-gray-900/80"
                  />
                </div>
              </div>

              {/* Generated */}
              <div className="space-y-3">
                 <div className="bg-lime-900/30 rounded-t-lg p-2 text-center border-b border-lime-700/50">
                  <span className="text-lime-400 font-mono text-sm uppercase tracking-widest font-bold">Dimension 35-C (Result)</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(132,204,22,0.3)] border-2 border-lime-500 group">
                  <img 
                    src={result.generated} 
                    alt="Rick and Morty Style" 
                    className="w-full h-auto object-contain bg-gray-900"
                  />
                  <div className="absolute inset-0 pointer-events-none ring-inset ring-4 ring-lime-500/20 rounded-2xl"></div>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 mt-12">
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-bold transition-all border border-gray-600 hover:border-gray-400"
              >
                <RefreshIcon />
                New Portal
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-8 py-3 bg-lime-600 hover:bg-lime-500 text-gray-900 rounded-full font-bold shadow-[0_0_20px_rgba(132,204,22,0.4)] hover:shadow-[0_0_30px_rgba(132,204,22,0.6)] transition-all transform hover:scale-105"
              >
                <DownloadIcon />
                Download Art
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-gray-600 text-sm">
        <p>Powered by Gemini 2.5 Flash • No Mortys were harmed in the making of this app.</p>
      </footer>
    </div>
  );
};

export default App;