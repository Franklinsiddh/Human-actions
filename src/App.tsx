import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
  Search, 
  Eye, 
  MessageSquare, 
  Image as ImageIcon, 
  Loader2, 
  ChevronRight, 
  AlertCircle,
  History,
  Trash2,
  BrainCircuit,
  Fingerprint
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---
interface AnalysisResult {
  implicitActions: string[];
  hiddenMotives: string[];
  psychologicalDynamics: string;
  subtext: string;
  rawMarkdown: string;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  result: AnalysisResult;
  image?: string;
}

// --- App Component ---
export default function App() {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('implicit_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('implicit_history', JSON.stringify(history));
  }, [history]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeInteraction = async () => {
    if (!input.trim() && !image) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `
        You are an elite behavioral psychologist, linguist, and expert in non-verbal communication.
        Your goal is to reveal "implicit actions"—the things people are doing without saying them, their hidden motives, and the deep subtext of their communication.
        
        Analyze the provided interaction (text dialogue, situation description, or image).
        
        Return your analysis in a structured JSON format with the following keys:
        - implicitActions: (Array of strings) Specific psychological "moves" being made (e.g., "Establishing dominance through feigned ignorance", "Seeking validation while appearing indifferent").
        - hiddenMotives: (Array of strings) The underlying "why" behind the behavior.
        - psychologicalDynamics: (String) A brief overview of the power balance or emotional tension.
        - subtext: (String) The "real" conversation happening beneath the words.
        - rawMarkdown: (String) A detailed, editorial-style psychological breakdown of the interaction.
      `;

      const parts: any[] = [{ text: input || "Analyze this image for implicit actions and subtext." }];
      if (image) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: image.split(',')[1]
          }
        });
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      const newResult: AnalysisResult = {
        implicitActions: data.implicitActions || [],
        hiddenMotives: data.hiddenMotives || [],
        psychologicalDynamics: data.psychologicalDynamics || "No dynamics identified.",
        subtext: data.subtext || "No subtext identified.",
        rawMarkdown: data.rawMarkdown || "No detailed breakdown available."
      };

      setResult(newResult);
      
      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        input: input,
        result: newResult,
        image: image || undefined
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 20));

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "Failed to decode interaction. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAll = () => {
    setInput('');
    setImage(null);
    setResult(null);
    setError(null);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-accent selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-line px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ink rounded-full flex items-center justify-center text-bg">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight">IMPLICIT <span className="font-serif italic text-accent">Decoder</span></h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono">Behavioral Subtext Analysis v1.0</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-ink hover:text-bg rounded-full transition-colors"
            title="History"
          >
            <History size={20} />
          </button>
          <div className="h-4 w-[1px] bg-line" />
          <div className="text-[10px] font-mono opacity-50">STATUS: READY</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Input Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-mono opacity-50 flex items-center gap-2">
                <MessageSquare size={12} /> Input Interaction Data
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe a conversation, a tense moment, or paste a dialogue here..."
                className="w-full h-48 bg-white border border-line rounded-2xl p-6 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none text-lg"
              />
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border border-line hover:bg-white transition-colors text-sm",
                  image && "bg-accent/10 border-accent/30 text-accent"
                )}
              >
                <ImageIcon size={16} />
                {image ? "Image Attached" : "Attach Scene Photo"}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              
              {image && (
                <button 
                  onClick={() => setImage(null)}
                  className="text-[10px] uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity"
                >
                  Remove Image
                </button>
              )}
            </div>

            <button
              onClick={analyzeInteraction}
              disabled={isAnalyzing || (!input.trim() && !image)}
              className="w-full bg-ink text-bg py-4 rounded-full flex items-center justify-center gap-3 hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Scanning Subtext...</span>
                </>
              ) : (
                <>
                  <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium tracking-wide">REVEAL IMPLICIT ACTIONS</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 bg-white border border-line rounded-3xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full scan-line opacity-20 pointer-events-none" />
              <h3 className="font-serif italic text-2xl">The Decoder's Eye</h3>
              <p className="text-sm opacity-70 leading-relaxed">
                Humans rarely say exactly what they mean. Every interaction is a series of psychological "moves" designed to protect the ego, gain status, or test boundaries.
              </p>
              <ul className="space-y-3 pt-4">
                {[
                  "Detects power imbalances",
                  "Uncovers ego-protection tactics",
                  "Identifies emotional manipulation",
                  "Reveals the 'unspoken' dialogue"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-mono opacity-60">
                    <ChevronRight size={12} className="text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {image && (
              <div className="rounded-3xl overflow-hidden border border-line aspect-video relative group">
                <img src={image} alt="Input" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-accent/10">
                    <div className="absolute top-0 left-0 w-full h-full scan-line opacity-40 pointer-events-none" />
                  </div>
                )}
                <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-bg text-xs font-mono">SCENE CAPTURED</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-12 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-600"
            >
              <AlertCircle className="shrink-0" />
              <div>
                <h4 className="font-bold">Analysis Interrupted</h4>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div 
              ref={resultsRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-line" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40">Analysis Complete</span>
                <div className="h-[1px] flex-1 bg-line" />
              </div>

              {/* Grid of Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Implicit Actions */}
                <div className="space-y-4">
                  <h4 className="text-[11px] uppercase tracking-widest font-mono opacity-50 flex items-center gap-2">
                    <Eye size={12} /> Implicit Actions
                  </h4>
                  <div className="space-y-2">
                    {result.implicitActions.map((action, i) => (
                      <div key={i} className="data-row p-4 bg-white rounded-xl flex items-start gap-3 group">
                        <span className="text-accent font-mono text-xs mt-1">0{i+1}</span>
                        <p className="text-sm font-medium">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hidden Motives */}
                <div className="space-y-4">
                  <h4 className="text-[11px] uppercase tracking-widest font-mono opacity-50 flex items-center gap-2">
                    <Search size={12} /> Hidden Motives
                  </h4>
                  <div className="space-y-2">
                    {result.hiddenMotives.map((motive, i) => (
                      <div key={i} className="data-row p-4 bg-white rounded-xl flex items-start gap-3">
                        <span className="text-accent font-mono text-xs mt-1">0{i+1}</span>
                        <p className="text-sm font-medium">{motive}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subtext & Dynamics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 p-8 bg-ink text-bg rounded-3xl space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest font-mono opacity-50">Psychological Dynamics</h4>
                  <p className="font-serif italic text-xl leading-relaxed">{result.psychologicalDynamics}</p>
                </div>
                <div className="lg:col-span-2 p-8 bg-white border border-line rounded-3xl space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest font-mono opacity-50">The Unspoken Subtext</h4>
                  <p className="text-2xl font-light tracking-tight leading-snug">"{result.subtext}"</p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="p-12 bg-white border border-line rounded-[3rem] space-y-8">
                <h4 className="text-[11px] uppercase tracking-widest font-mono opacity-50 text-center">Full Behavioral Breakdown</h4>
                <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:italic prose-p:text-lg prose-p:leading-relaxed">
                  <Markdown>{result.rawMarkdown}</Markdown>
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={clearAll}
                  className="px-8 py-3 rounded-full border border-line hover:bg-ink hover:text-bg transition-all text-sm font-medium"
                >
                  Start New Analysis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-[60]"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-bg border-l border-line z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-line flex justify-between items-center">
                <h2 className="font-serif italic text-2xl">Analysis History</h2>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-line rounded-full">
                  <Trash2 size={20} className="opacity-0" /> {/* Spacer */}
                  <ChevronRight size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-4">
                    <History size={48} />
                    <p className="text-sm font-mono uppercase tracking-widest">No records found</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 bg-white border border-line rounded-2xl hover:border-accent/30 transition-all cursor-pointer group"
                      onClick={() => {
                        setResult(item.result);
                        setInput(item.input);
                        setImage(item.image || null);
                        setShowHistory(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono opacity-40">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(item.id);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-sm font-medium line-clamp-2 mb-2">
                        {item.input || "Image Analysis"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 bg-bg rounded-full font-mono opacity-60">
                          {item.result.implicitActions.length} Actions
                        </span>
                        {item.image && <ImageIcon size={12} className="opacity-40" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-line flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 text-[10px] font-mono uppercase tracking-widest">
        <div>© 2026 Implicit Decoder Systems</div>
        <div className="flex gap-8">
          <span>Privacy Protocol Active</span>
          <span>Neural Engine: Gemini 3.1 Pro</span>
        </div>
      </footer>
    </div>
  );
}
