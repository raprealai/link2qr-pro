
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { analyzeLink } from './services/geminiService';
import { QrCodeData } from './types';
import { HistoryItem } from './components/HistoryItem';
import { 
  Link as LinkIcon, 
  Settings2, 
  History as HistoryIcon, 
  Sparkles, 
  Download, 
  Share2, 
  Trash2,
  Check,
  ChevronRight,
  Loader2,
  Github
} from 'lucide-react';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<QrCodeData[]>([]);
  const [currentQr, setCurrentQr] = useState<QrCodeData | null>(null);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showHistory, setShowHistory] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('qr_history');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setHistory(parsed.slice(0, 50));
      }
    } catch (error) {
      console.warn('Failed to parse qr_history, clearing corrupted data.', error);
      localStorage.removeItem('qr_history');
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('qr_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !url.startsWith('http')) {
      alert('Please enter a valid URL (starting with http:// or https://)');
      return;
    }

    setIsGenerating(true);
    setIsAnalyzing(true);

    try {
      const analysis = await analyzeLink(url);
      const newQr: QrCodeData = {
        id: crypto.randomUUID(),
        url,
        timestamp: Date.now(),
        ...analysis,
        fgColor,
        bgColor
      };
      
      setCurrentQr(newQr);
      setHistory(prev => [newQr, ...prev].slice(0, 50));
      setUrl('');
    } catch (error) {
      console.error(error);
      const fallbackQr: QrCodeData = {
        id: crypto.randomUUID(),
        url,
        timestamp: Date.now(),
        title: "Manual Code",
        description: "A manually generated QR code.",
        category: "General",
        fgColor,
        bgColor
      };
      setCurrentQr(fallbackQr);
      setHistory(prev => [fallbackQr, ...prev].slice(0, 50));
    } finally {
      setIsGenerating(false);
      setIsAnalyzing(false);
    }
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your entire history?')) {
      setHistory([]);
      localStorage.removeItem('qr_history');
    }
  };

  const downloadCurrentQr = () => {
    if (!currentQr) return;
    const svg = qrRef.current;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 2000;
      canvas.height = 2000;
      ctx?.drawImage(img, 0, 0, 2000, 2000);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${currentQr.title.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
            <LinkIcon size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Link2QR <span className="text-blue-600">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showHistory ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <HistoryIcon size={20} />
            <span className="hidden sm:inline font-medium">History</span>
            {history.length > 0 && <span className="ml-1 bg-blue-100 px-1.5 py-0.5 rounded text-xs font-bold">{history.length}</span>}
          </button>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <Github size={24} />
          </a>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator & Options */}
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Create New QR</h2>
              <p className="text-slate-500">Enter a URL to generate a high-quality, customized QR code.</p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon size={20} />
                </div>
                <input 
                  type="url" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-lg"
                  required
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Foreground Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-none p-0 overflow-hidden"
                    />
                    <span className="text-sm font-mono text-slate-400">{fgColor.toUpperCase()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Background Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-none p-0 overflow-hidden"
                    />
                    <span className="text-sm font-mono text-slate-400">{bgColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
                    Generate QR Code
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Tips Section */}
          {!currentQr && !showHistory && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <h3 className="text-emerald-800 font-bold mb-2 flex items-center gap-2">
                  <Check size={18} />
                  Always Workable
                </h3>
                <p className="text-emerald-700 text-sm opacity-80 leading-relaxed">
                  Our QR codes follow standard protocols, ensuring they can be scanned by any smartphone or specialized QR reader.
                </p>
              </div>
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                  <Sparkles size={18} />
                  AI Enhancement
                </h3>
                <p className="text-blue-700 text-sm opacity-80 leading-relaxed">
                  We use Gemini AI to automatically summarize and categorize your links, making your history much easier to manage.
                </p>
              </div>
            </div>
          )}

          {/* History Sidebar Content (Mobile only) */}
          {showHistory && (
            <div className="lg:hidden space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-800">Your History</h2>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-sm text-red-500 hover:text-red-600 font-medium">
                    Clear All
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {history.map(item => (
                  <HistoryItem key={item.id} item={item} onDelete={deleteFromHistory} />
                ))}
                {history.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                    No history yet. Generate your first code!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Preview & History */}
        <div className="lg:col-span-5 space-y-8">
          {/* Current QR Preview */}
          <div className="sticky top-24">
            <section className={`bg-white p-8 rounded-3xl shadow-xl border border-slate-100 transition-all transform ${currentQr ? 'scale-100 opacity-100' : 'scale-95 opacity-50 blur-[2px]'}`}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-800">Live Preview</h2>
                {currentQr && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    Ready to Scan
                  </span>
                )}
              </div>

              <div className="flex justify-center mb-8 relative group">
                <div 
                  className="p-6 rounded-3xl shadow-2xl transition-all duration-500 group-hover:rotate-1"
                  style={{ backgroundColor: currentQr?.bgColor || bgColor }}
                >
                  <QRCodeSVG 
                    ref={qrRef}
                    value={currentQr?.url || "https://example.com"} 
                    size={280}
                    level="H" // High error correction
                    includeMargin={false}
                    fgColor={currentQr?.fgColor || fgColor}
                    bgColor={currentQr?.bgColor || bgColor}
                  />
                </div>
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <p className="font-semibold text-slate-800">Gemini analyzing link...</p>
                  </div>
                )}
              </div>

              {currentQr ? (
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <h3 className="text-2xl font-bold text-slate-800">{currentQr.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{currentQr.description}</p>
                    <div className="pt-2 flex justify-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        {currentQr.category}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={downloadCurrentQr}
                      className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all"
                    >
                      <Download size={18} />
                      Download
                    </button>
                    <button 
                      onClick={() => navigator.clipboard.writeText(currentQr.url)}
                      className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all"
                    >
                      <Share2 size={18} />
                      Copy Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Settings2 size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">Your generated QR will appear here.</p>
                </div>
              )}
            </section>

            {/* History for large screens */}
            <div className="hidden lg:block mt-8">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <HistoryIcon size={18} className="text-blue-600" />
                  Recent Creations
                </h3>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium underline underline-offset-4">
                    Clear History
                  </button>
                )}
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map(item => (
                  <HistoryItem key={item.id} item={item} onDelete={deleteFromHistory} />
                ))}
                {history.length === 0 && (
                  <div className="text-center py-12 px-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <p className="text-sm">Your generation history will be stored here locally.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <LinkIcon size={16} />
            <span className="text-sm font-medium">Link2QR Pro © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-slate-500 hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-blue-600">Terms of Service</a>
            <a href="#" className="text-sm text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1">
              Feedback <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </footer>

      {/* Tailwind Custom Styles via Inline for simplicity since standard CSS files are restricted */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default App;
