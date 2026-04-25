import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Package, MapPin, Truck, ChevronRight, CheckCircle2, Search, X, Loader2, Info, Star, Bell, AlertTriangle, TrendingUp, UtensilsCrossed, Pizza, Sandwich, Coffee, Beer, Sun, Moon, Store, ArrowLeft, Sparkles, Send, ImageIcon, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MENU, Order, Vendor, BLOCKS, PICKUP_LOCATIONS, MenuItem, SHOPS } from './types';
import { orchestrateDelivery, getFoodSuggestions, askCricketGuru } from './services/aiService';

export default function App() {
  const [role, setRole] = useState<'spectator' | 'vendor' | 'admin'>('spectator');
  const [cart, setCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [seat, setSeat] = useState('42');
  const [block, setBlock] = useState('Block A');
  const [landmark, setLandmark] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState('Loading daily special...');
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // CricketGuru States
  const [isGuruOpen, setIsGuruOpen] = useState(false);
  const [guruInput, setGuruInput] = useState('');
  const [guruImage, setGuruImage] = useState<string | null>(null);
  const [guruChat, setGuruChat] = useState<{role: 'user' | 'guru', content: string, image?: string}[]>([]);
  const [isGuruTyping, setIsGuruTyping] = useState(false);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      updateSuggestions();
    }
  }, [orders.length]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
  }, [theme]);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setOrders(data.orders);
      setVendors(data.vendors);
    } catch (e) {
      console.error("Fetch error", e);
    }
  };

  const updateSuggestions = async () => {
    const suggestion = await getFoodSuggestions(orders);
    setAiSuggestion(suggestion);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);
    
    const newOrder = {
      items: cart.map(c => c.item),
      seat,
      block,
      landmark,
      customerName,
      customerPhone,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
      const order = await res.json();
      
      const assignment = await orchestrateDelivery(order, vendors);
      
      await fetch(`/api/orders/${order.id}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'preparing' }),
      });

      // Assign vendor specifically in local state simulation
      // In a real app the backend would handle assignment logic
      
      setCart([]);
      setIsOrdering(false);
      fetchState();
    } catch (e) {
      console.error(e);
      setIsOrdering(false);
    }
  };

  const updateLandmark = async (orderId: string) => {
    const newLandmark = prompt("Update your delivery landmark:", "");
    if (newLandmark === null) return;
    
    await fetch(`/api/orders/${orderId}/update-landmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landmark: newLandmark })
    });
    fetchState();
  };

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}/update-status`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchState();
  };

  const sendAdminMessage = async (orderId: string, message: string) => {
    await fetch(`/api/orders/${orderId}/admin-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    fetchState();
  };

  const submitFeedback = async () => {
    if (!feedbackOrder) return;
    await fetch(`/api/orders/${feedbackOrder.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment })
    });
    setFeedbackOrder(null);
    setRating(0);
    setComment('');
    fetchState();
  };

  const handleGuruImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setGuruImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sendGuruMessage = async () => {
    if (!guruInput.trim() && !guruImage) return;

    const userMessage = { role: 'user' as const, content: guruInput, image: guruImage || undefined };
    setGuruChat(prev => [...prev, userMessage]);
    
    // Clear input immediately for feel
    const currentInput = guruInput;
    const currentImage = guruImage;
    setGuruInput('');
    setGuruImage(null);
    setIsGuruTyping(true);

    const response = await askCricketGuru(currentInput, currentImage || undefined);
    
    setGuruChat(prev => [...prev, { role: 'guru', content: response }]);
    setIsGuruTyping(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-10">
      <AnimatePresence>
        {role === 'spectator' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="stadium-bg"
          />
        )}
      </AnimatePresence>
      <div className="mission-control-grid absolute inset-0 z-0 pointer-events-none opacity-40" />
      <div className="scanline z-50 pointer-events-none" />
      
      <div className="relative z-10 font-sans">
        <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl p-5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <img 
                src="https://imgs.search.brave.com/VTK8vnAUUASX3XAnBavVpBZC-rjZWybJSLS_oRGswHA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jcnlz/dGFscG5nLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyNS8w/OS9pcGwtbG9nby5w/bmc" 
                alt="IPL Logo" 
                className="h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="font-display font-medium text-xl tracking-tight leading-none uppercase">
                  ZAIKA <span className="text-accent font-black tracking-tighter">STADIUM AGENT</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono">Apka Stadium, Apka Swad</p>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-accent group"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform text-slate-700" />}
            </button>

            <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/10 gap-1">
            {(['spectator', 'vendor', 'admin'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-6 py-2.5 rounded-lg text-xs uppercase tracking-[0.2em] font-bold transition-all ${role === r ? 'bg-accent text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                {r.replace('spectator', 'FANS').replace('vendor', 'KITCHEN')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        <AnimatePresence mode="wait">
          {role === 'spectator' && (
            <motion.div 
              key="spectator"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
              id="spectator-view"
            >
              {/* AI Suggestion Banner & CricketGuru Hub */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="ai-hub-section">
                <div className="md:col-span-8">
                  <div className="glass-card accent-border p-6 flex flex-col md:flex-row items-center gap-6 overflow-hidden relative h-full" id="ai-banner-card">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <UtensilsCrossed className="w-24 h-24 rotate-12" />
                    </div>
                    <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center shrink-0 border border-accent/20" id="ai-icon-container">
                      <TrendingUp className="w-8 h-8 text-accent" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="font-display text-accent font-black text-sm tracking-widest uppercase mb-1">Kitchen Recommendation</h3>
                      <p className="text-lg md:text-xl font-medium leading-relaxed italic opacity-90" id="ai-recommendation-text">"{aiSuggestion}"</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <button 
                    onClick={() => setIsGuruOpen(true)}
                    className="glass-card w-full p-6 group relative overflow-hidden h-full border-accent/30 hover:border-accent transition-all active:scale-95"
                  >
                     <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors" />
                     <div className="flex flex-col items-center justify-center text-center relative z-10 gap-3">
                        <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.5)]">
                          <Sparkles className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h3 className="font-display font-black text-lg tracking-tighter uppercase italic">CricketGuru</h3>
                          <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Ask about the match</p>
                        </div>
                     </div>
                  </button>
                </div>
              </div>

              {/* CricketGuru Fullscreen Overlay */}
              <AnimatePresence>
                {isGuruOpen && (
                  <motion.div
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="w-full max-w-4xl max-h-[85vh] flex flex-col relative"
                    >
                      <button 
                        onClick={() => setIsGuruOpen(false)}
                        className="absolute -top-12 right-0 text-white/40 hover:text-white transition-colors"
                      >
                        <X className="w-8 h-8" />
                      </button>

                      {/* AI Header */}
                      <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-3 bg-accent/10 px-6 py-2 rounded-full border border-accent/20 mb-4">
                           <Sparkles className="w-4 h-4 text-accent" />
                           <span className="text-xs font-black tracking-[0.3em] text-accent uppercase">Agentic Intelligence</span>
                        </div>
                        <h2 className="text-6xl font-display font-black uppercase italic tracking-tighter text-white">CricketGuru</h2>
                        <p className="text-white/40 font-medium mt-2">Learn concepts, analyze visuals, and master the game.</p>
                      </div>

                      {/* Chat History */}
                      <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-4 custom-scrollbar min-h-[300px]">
                        {guruChat.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center gap-4">
                             <MessageSquare className="w-16 h-16" />
                             <p className="text-sm font-mono max-w-xs uppercase tracking-widest">Awaiting match data or fan queries. How can I help today?</p>
                          </div>
                        ) : (
                          guruChat.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-3xl p-5 ${msg.role === 'user' ? 'bg-accent/10 border border-accent/20 text-white' : 'glass-card text-white/90 border-white/5'}`}>
                                {msg.image && (
                                  <img src={msg.image} alt="User upload" className="rounded-xl mb-4 max-w-xs border border-white/10" />
                                )}
                                <p className="leading-relaxed text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                        {isGuruTyping && (
                          <div className="flex justify-start">
                             <div className="glass-card p-5 border-white/5 flex gap-2">
                                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                             </div>
                          </div>
                        )}
                      </div>

                      {/* Central Input Box - AS REQUESTED */}
                      <div className="relative group">
                         <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-500 rounded-[2.5rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                         <div className="glass-card p-4 rounded-[2rem] flex items-center gap-4 relative z-10 border-white/20">
                            <label className="shrink-0 cursor-pointer p-4 hover:bg-white/5 rounded-2xl transition-colors">
                               <ImageIcon className={`w-6 h-6 ${guruImage ? 'text-accent' : 'text-white/40'}`} />
                               <input type="file" accept="image/*" className="hidden" onChange={handleGuruImageUpload} />
                            </label>
                            
                            <input 
                              type="text"
                              value={guruInput}
                              onChange={(e) => setGuruInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && sendGuruMessage()}
                              placeholder="Ask anything about cricket..."
                              className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-white placeholder:text-white/20 px-2"
                            />

                            <button 
                              onClick={sendGuruMessage}
                              disabled={isGuruTyping}
                              className="bg-accent text-black p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.4)] disabled:opacity-50"
                            >
                               {isGuruTyping ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                            </button>
                         </div>
                         {guruImage && (
                           <div className="absolute -top-20 left-4 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center gap-2">
                              <img src={guruImage} className="h-12 w-12 object-cover rounded-lg" alt="Preview" />
                              <button onClick={() => setGuruImage(null)} className="text-white/40 hover:text-red-500"><X className="w-4 h-4" /></button>
                           </div>
                         )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stadium Selector & Info */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10" id="location-selection-grid">
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-3xl font-display font-black tracking-tighter uppercase italic">Select Your Zone</h2>
                      <p className="text-white/40 text-[10px] font-mono tracking-widest uppercase mt-1">Tap your block to set delivery location</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-accent uppercase font-black">Current Selection</p>
                      <p className="text-2xl font-display font-bold text-white uppercase" id="current-selected-block">{block}</p>
                    </div>
                  </div>

                  <div className="glass-card p-10 relative overflow-hidden group" id="stadium-map-container">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.05),transparent_70%)]" />
                    
                    {/* Stadium Visual Layout */}
                    <div className="relative w-full aspect-[16/10] max-w-2xl mx-auto flex items-center justify-center">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 border-4 border-dashed border-white/5 rounded-[120px] pointer-events-none" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-green-900/10 border-2 border-white/10 rounded-[80px] flex items-center justify-center pointer-events-none overflow-hidden" id="stadium-center-field">
                        <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] absolute">Ground Field</span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 w-full h-full relative z-10" id="stadium-blocks-grid">
                        {BLOCKS.map((b) => {
                          const isActive = block === b;
                          return (
                            <motion.button
                              key={b}
                              id={`block-select-${b.replace(/\s+/g, '-').toLowerCase()}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setBlock(b)}
                              className={`relative overflow-hidden rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 p-4
                                ${isActive 
                                  ? 'bg-accent border-accent text-black shadow-[0_0_30px_rgba(0,242,255,0.4)] z-20' 
                                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'}`}
                            >
                              <div className={`p-2 rounded-lg ${isActive ? 'bg-black/10' : 'bg-white/5'}`}>
                                <MapPin className={`w-5 h-5 ${isActive ? 'text-black' : 'text-white/20'}`} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">{b.replace('Block ', '')}</span>
                              {isActive && (
                                <motion.div 
                                  layoutId="active-indicator"
                                  className="absolute bottom-1 w-1 h-1 bg-black rounded-full" 
                                />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="glass-card p-8 border-l-4 border-accent h-full flex flex-col justify-between" id="seating-details-card">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/20">
                          <MapPin className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-display font-black text-sm uppercase tracking-widest">Seating Verification</h3>
                          <p className="text-[10px] font-mono text-white/40">Enter seat details for AI dispatch</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">SEAT NUMBER</label>
                          <div className="relative">
                            <input 
                              id="seat-input"
                              type="text" 
                              value={seat}
                              onChange={(e) => setSeat(e.target.value)}
                              placeholder="e.g. 42"
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg font-black outline-none focus:border-accent/40 focus:bg-white/10 transition-all font-mono"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                              <Search className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">CONTACT DETAILS</label>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               <input 
                                 id="name-input"
                                 type="text" 
                                 value={customerName}
                                 onChange={(e) => setCustomerName(e.target.value)}
                                 placeholder="Your Name"
                                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-accent/40 focus:bg-white/10 transition-all"
                               />
                               <input 
                                 id="phone-input"
                                 type="tel" 
                                 value={customerPhone}
                                 onChange={(e) => setCustomerPhone(e.target.value)}
                                 placeholder="Mobile Number"
                                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-accent/40 focus:bg-white/10 transition-all"
                               />
                             </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">LANDMARK & IDENTIFICATION</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                               {[
                                 { label: 'Full Shirt', icon: '👕' },
                                 { label: 'Flashing Phone', icon: '📱' },
                                 { label: 'Blue Jersey', icon: '🏏' },
                                 { label: 'Cap/Hat', icon: '🧢' }
                               ].map(cue => (
                                 <button 
                                   key={cue.label}
                                   onClick={() => setLandmark(prev => prev ? `${prev}, ${cue.label}` : cue.label)}
                                   className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-accent transition-all flex items-center gap-2"
                                 >
                                   <span>{cue.icon}</span> {cue.label}
                                 </button>
                               ))}
                            </div>
                            <textarea 
                              id="landmark-input"
                              placeholder="e.g. Near Block A Exit, wearing Blue Jersey, waving phone"
                              value={landmark}
                              onChange={(e) => setLandmark(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-accent/40 focus:bg-white/10 transition-all min-h-[100px] leading-relaxed"
                            />
                            <p className="text-[9px] text-white/20 italic text-right">Crucial for delivery partner verification</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <Info className="w-5 h-5 text-white/20" />
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                        Your location is shared with the assigned kitchen and roaming agent for the duration of this delivery only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop Selection & Detailed Menu */}
              <div className="space-y-10" id="shop-system-section">
                {!selectedShopId ? (
                  <div className="space-y-8" id="vendor-selection-view">
                    <div className="border-b border-white/5 pb-6">
                      <h2 className="text-4xl font-display font-black tracking-tighter uppercase italic">Stadium Hub</h2>
                      <p className="text-accent text-[10px] font-mono tracking-widest uppercase font-black">Choose your favorite outlet from across Delhi</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="vendor-grid">
                      {SHOPS.map(shop => (
                        <motion.div
                          key={shop.id}
                          id={`shop-card-${shop.id}`}
                          whileHover={{ y: -8, scale: 1.02 }}
                          onClick={() => setSelectedShopId(shop.id)}
                          className="glass-card p-8 cursor-pointer group border-white/10 hover:border-accent/40 transition-all relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Store className="w-20 h-20" />
                          </div>
                          <div className="flex items-center gap-5 mb-6">
                            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center text-3xl border border-accent/20 group-hover:scale-110 transition-transform">
                              {shop.logo}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold uppercase">{shop.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                   <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                   <span className="text-xs font-black text-white/50">{shop.rating} Rated</span>
                                </div>
                            </div>
                          </div>
                          <p className="text-xs text-white/40 mb-6 font-medium leading-relaxed italic">"{shop.tagline}"</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-widest uppercase text-accent border-b border-accent/20 pb-1">View Full Menu</span>
                            <ChevronRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10" id="detailed-menu-view">
                    {/* Detailed Menu Header */}
                    <div className="glass-card p-10 relative overflow-hidden" id="menu-header">
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(0,242,255,0.05),transparent_50%)]" />
                       <button 
                         id="back-to-hub-btn"
                         onClick={() => setSelectedShopId(null)}
                         className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-accent transition-colors mb-8 group"
                       >
                         <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Stadium Hub
                       </button>
                       
                       {(() => {
                         const shop = SHOPS.find(s => s.id === selectedShopId);
                         if (!shop) return null;
                         return (
                           <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                              <div className="w-32 h-32 bg-accent/20 rounded-4xl flex items-center justify-center text-6xl border-4 border-accent/10 shadow-2xl">
                                {shop.logo}
                              </div>
                              <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center gap-4 flex-col md:flex-row">
                                  <h2 className="text-5xl font-display font-black tracking-tighter uppercase italic">{shop.name}</h2>
                                  <div className="bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20 text-[10px] font-black text-accent uppercase tracking-widest">
                                    Official Outlet
                                  </div>
                                </div>
                                <p className="text-lg text-white/60 mt-4 max-w-2xl leading-relaxed">{shop.description}</p>
                                <div className="flex items-center gap-6 mt-8 justify-center md:justify-start">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Outlet Quality</span>
                                      <span className="text-xl font-bold text-accent">TOP TIER</span>
                                   </div>
                                   <div className="w-px h-8 bg-white/5" />
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Global Sourcing</span>
                                      <span className="text-xl font-bold text-accent">YES</span>
                                   </div>
                                </div>
                              </div>
                           </div>
                         );
                       })()}
                    </div>

                    {/* Menu Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-12">
                        <div className="border-b border-white/5 pb-4 mb-6 flex items-end justify-between">
                          <div>
                            <h2 className="text-3xl font-display font-black tracking-tighter uppercase italic">Curated Selection</h2>
                            <p className="text-accent text-[10px] font-mono tracking-widest uppercase font-black">All original Delhi outlet favorites</p>
                          </div>
                          <div className="flex gap-2">
                             {['ALL', 'PIZZA', 'DRINKS', 'SNACKS'].map(cat => (
                               <button key={cat} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest hover:border-accent/30 hover:text-accent transition-all">{cat}</button>
                             ))}
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="detailed-items-grid">
                          {MENU.filter(item => item.brandId === selectedShopId).map(item => (
                            <motion.div 
                              whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                              key={item.id}
                              id={`menu-item-${item.id}`}
                              onClick={() => addToCart(item)}
                              className="glass-card p-6 group cursor-pointer border-white/[0.08] hover:border-accent/40 transition-all flex items-center gap-6 relative overflow-hidden"
                            >
                              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative z-10 border border-white/5">
                                 {item.icon === 'Pizza' && <Pizza className="w-10 h-10 text-orange-400" />}
                                 {(item.icon === 'Burger' || item.icon === 'Utensils') && <UtensilsCrossed className="w-10 h-10 text-red-400" />}
                                 {item.icon === 'Sandwich' && <Sandwich className="w-10 h-10 text-yellow-300" />}
                                 {item.icon === 'Coffee' && <Coffee className="w-10 h-10 text-brown-400" />}
                                 {item.icon === 'IceCream' && <Coffee className="w-10 h-10 text-pink-300" />}
                                 {item.icon === 'Wrap' && <Sandwich className="w-10 h-10 text-green-400" />}
                              </div>
                              <div className="flex-1 relative z-10">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-bold text-base leading-tight uppercase tracking-tight">{item.name}</h3>
                                    <p className="text-[10px] text-white/30 mt-1 uppercase font-black tracking-widest">{item.category}</p>
                                  </div>
                                  <span className="font-display text-xl font-black italic">₹{item.price}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-accent/50"/> {item.avgPrepTime}M</span>
                                  <span className="w-px h-2.5 bg-white/10" />
                                  <span className="text-accent underline decoration-accent/20">ADD TO CART</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-4">
                        <div className="glass-card p-8 space-y-6 sticky top-28 bg-[#0a0d12]/80" id="spectator-cart-card">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ShoppingCart className="w-6 h-6 text-accent" />
                              <h2 className="font-display font-black text-xl tracking-tight uppercase italic leading-none">Your Basket</h2>
                            </div>
                            <span className="bg-accent/10 text-accent px-3 py-1 rounded text-[10px] font-black">{cart.reduce((acc, curr) => acc + curr.quantity, 0)} ITEMS</span>
                          </div>
                          
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar" id="cart-items-list">
                            {cart.length === 0 ? (
                              <div className="py-10 text-center opacity-20 flex flex-col items-center gap-3">
                                <Package className="w-10 h-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Bucket Khali Hai</p>
                              </div>
                            ) : (
                              cart.map((c, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5" id={`cart-item-row-${i}`}>
                                  <div>
                                     <p className="text-xs font-bold uppercase">{c.item.name}</p>
                                     <p className="text-[10px] text-white/40">Qty: {c.quantity} • ₹{c.item.price * c.quantity}</p>
                                  </div>
                                  <button onClick={() => setCart(prev => prev.filter(it => it.item.id !== c.item.id))} className="text-white/20 hover:text-red-500 transition-colors" id={`remove-item-${i}`}>
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="pt-6 border-t border-white/10" id="cart-summary-section">
                            <div className="flex justify-between mb-8 items-end">
                              <span className="text-white font-black text-sm uppercase tracking-tighter">Order Total</span>
                              <span className="font-display text-4xl font-black text-accent italic shadow-accent/20 drop-shadow-lg" id="cart-total-display">₹{cart.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0)}</span>
                            </div>
                            <button 
                              id="place-order-button"
                              disabled={cart.length === 0 || isOrdering}
                              onClick={placeOrder}
                              className="relative w-full bg-accent text-black font-black py-5 rounded-2xl shadow-[0_0_40px_rgba(0,242,255,0.2)] disabled:opacity-20 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-95 transition-all text-sm tracking-[0.15em] flex flex-col items-center justify-center gap-1 group overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                              <span className="flex items-center gap-2 relative z-10">
                                {isOrdering ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                {isOrdering ? "PROCESSING..." : "CONFIRM & PAY"}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                  {/* Active Orders Trackbar */}
                  <div className="space-y-4" id="spectator-active-orders">
                    <AnimatePresence>
                      {orders.filter(o => o.status !== 'completed').map(order => (
                        <motion.div 
                          key={order.id}
                          id={`order-tracking-${order.id}`}
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -20, opacity: 0 }}
                          className="glass-card p-6 border-l-4 border-accent relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Truck className="w-16 h-16 -rotate-12" />
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                               <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
                               <h4 className="font-black text-xs uppercase tracking-widest text-accent italic">{order.status}</h4>
                            </div>
                            <span className="text-[10px] font-mono text-white/30">ID: {order.id}</span>
                          </div>
                          
                          <p className="text-xl font-display font-bold uppercase mb-4 leading-none">{order.items[0].name}</p>

                          <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-4 bg-white/5 p-3 rounded-lg">
                            <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin"/> {order.estimatedPrepTime}M LEFT</span>
                            <span className="w-px h-3 bg-white/10" />
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> BLOCK {order.block.replace('Block ', '')}</span>
                          </div>

                          <button 
                            id={`update-landmark-${order.id}`}
                            onClick={() => updateLandmark(order.id)}
                            className="w-full py-3 bg-accent/10 border border-accent/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all text-accent"
                          >
                            {order.landmark ? "Adjust Landmark" : "Add Landmark Info"}
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Feedback Prompts */}
                  <div className="space-y-4" id="spectator-feedback-prompts">
                    <AnimatePresence>
                      {orders.filter(o => o.status === 'completed' && !o.feedback).map(order => (
                        <motion.div 
                          key={order.id}
                          id={`feedback-prompt-${order.id}`}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="glass-card p-5 border-l-4 border-green-500"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="font-bold text-sm">Delivered! How was it?</p>
                          </div>
                          <button 
                            id={`rate-btn-${order.id}`}
                            onClick={() => setFeedbackOrder(order)}
                            className="w-full py-2 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/5 uppercase tracking-widest"
                          >
                            RATE EXPERIENCE
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
              </motion.div>
          )}

          {role === 'vendor' && (
            <motion.div 
              key="vendor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
              id="vendor-dashboard"
            >
              <div className="flex justify-between items-center bg-accent text-black p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,242,255,0.2)] relative overflow-hidden" id="vendor-header-banner">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />
                <div className="flex items-center gap-6 relative z-10" id="vendor-title-section">
                  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border-4 border-black/10 shadow-xl" id="vendor-header-icon">
                    <UtensilsCrossed className="w-9 h-9 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter leading-none">Kitchen Central</h2>
                    <p className="text-[10px] font-black opacity-60 tracking-[0.2em] mt-1">OPTIMIZING FOR FASTEST PREPARATION</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-10 relative z-10" id="vendor-header-stats">
                   <div className="flex flex-col items-end">
                     <p className="text-[10px] font-black opacity-60">ACTIVE TASKS</p>
                     <p className="text-4xl font-mono font-black">{orders.filter(o => o.status !== 'completed').length}</p>
                   </div>
                   <div className="h-12 w-px bg-black/10" />
                   <div className="flex flex-col items-end">
                     <p className="text-[10px] font-black opacity-60">AVG PREP</p>
                     <p className="text-4xl font-mono font-black">9.2<span className="text-sm">M</span></p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="vendor-orders-grid">
                {orders.filter(o => ['pending', 'preparing', 'assigned', 'delivering'].includes(o.status)).map(order => (
                  <motion.div 
                    layout
                    key={order.id} 
                    id={`vendor-order-card-${order.id}`}
                    className={`glass-card p-8 flex flex-col justify-between border-4 relative overflow-hidden group transition-all hover:bg-white/[0.05] ${order.status === 'pending' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-white/10'}`}
                  >
                    {order.status === 'pending' && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" id={`pending-ping-${order.id}`} />}
                    <div>
                      <div className="flex justify-between items-start mb-8">
                        <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl font-mono text-xl font-black text-accent" id={`vendor-order-id-${order.id}`}>#{order.id}</span>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Time Limit</p>
                          <div className="flex items-center gap-2 justify-end">
                            <Loader2 className="w-4 h-4 text-accent animate-spin" />
                            <p className="text-2xl font-mono text-white font-black underline decoration-accent/30">{order.estimatedPrepTime}:00</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3">
                           <Pizza className="w-5 h-5 text-accent/50" />
                           <h3 className="text-2xl font-display font-black uppercase text-white leading-tight">{order.items[0].name}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2" id={`vendor-order-items-${order.id}`}>
                           {order.items.map((it, idx) => (
                             <span key={idx} className="bg-white/5 border border-white/10 px-3 py-1 rounded text-[10px] font-black uppercase text-white/50">{it.name} x1</span>
                           ))}
                        </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-8 group-hover:bg-white/10 transition-colors" id={`vendor-order-location-${order.id}`}>
                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-white/5">
                           <div>
                             <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Fan Details</p>
                             <p className="text-sm font-black text-white uppercase">{order.customerName || 'Anonymous'}</p>
                             <p className="text-xs font-mono text-accent">{order.customerPhone || 'No Phone'}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Location</p>
                              <p className="text-sm font-black text-accent uppercase">{order.block} • SEAT {order.seat}</p>
                           </div>
                        </div>
                        <p className="text-xs font-medium italic opacity-70 leading-relaxed">
                           <span className="text-accent not-italic font-black text-[10px] mr-2 tracking-widest uppercase">Cues:</span>
                           "{order.landmark || 'No special landmark'}"
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3" id={`vendor-order-actions-${order.id}`}>
                       {order.status === 'pending' && (
                         <button id={`start-prep-${order.id}`} onClick={() => updateStatus(order.id, 'preparing')} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl hover:bg-red-500 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-red-900/20">START PREPARATION</button>
                       )}
                       {order.status === 'preparing' && (
                         <button id={`mark-ready-${order.id}`} onClick={() => updateStatus(order.id, 'delivering')} className="w-full bg-accent text-black font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em] shadow-[0_0_30px_rgba(0,242,255,0.2)]">MARK AS READY</button>
                       )}
                       {order.status === 'delivering' && (
                         <button id={`confirm-dispatch-${order.id}`} onClick={() => updateStatus(order.id, 'completed')} className="w-full bg-green-600 text-white font-black py-5 rounded-2xl hover:bg-green-500 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-green-900/20">CONFIRM DISPATCH</button>
                       )}
                    </div>
                  </motion.div>
                ))}
                {orders.filter(o => ['pending', 'preparing', 'assigned', 'delivering'].includes(o.status)).length === 0 && (
                  <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-20 space-y-4 border-2 border-dashed border-white/10 rounded-3xl font-mono text-xs uppercase tracking-widest" id="vendor-empty-state">
                    <Package className="w-16 h-16" />
                    <span>No active kitchen tasks</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {role === 'admin' && (
            <motion.div 
              key="admin"
              id="admin-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="admin-stats-grid">
                {[
                  { label: "Total Revenue", val: "₹1.4L", trend: "+12%", color: "text-accent", id: "stat-revenue" },
                  { label: "Live Queue", val: orders.filter(o => o.status !== 'completed').length, trend: "Stable", color: "text-red-500", id: "stat-queue" },
                  { label: "Efficiency", val: "94%", trend: "+2.4%", color: "text-green-500", id: "stat-efficiency" },
                  { label: "Fan Rating", val: "4.9★", trend: "+0.1", color: "text-yellow-500", id: "stat-rating" },
                ].map((stat, i) => (
                  <div key={i} id={stat.id} className="glass-card p-10 border-b-8 border-b-accent relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <TrendingUp className="w-16 h-16" />
                    </div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-5xl font-display font-black tracking-tighter italic">{stat.val}</p>
                      <span className={`text-[11px] font-mono font-bold px-2 py-1 rounded bg-white/5 ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-accent'}`}>{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 glass-card p-12 overflow-hidden relative" id="crowd-flow-container">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,242,255,0.03),transparent_70%)]" />
                  <div className="flex justify-between items-center mb-10 relative z-10">
                    <div>
                      <h3 className="font-display font-black uppercase italic tracking-tighter text-3xl flex items-center gap-4 group">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" /> Real-time Crowd Flow
                      </h3>
                      <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Live order density per block</p>
                    </div>
                    <div className="flex gap-4">
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-red-500 rounded-sm" />
                         <span className="text-[9px] font-black opacity-40 uppercase">Orders</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-accent rounded-full" />
                         <span className="text-[9px] font-black opacity-40 uppercase">Vendors</span>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-6 aspect-[16/7] relative z-10" id="crowd-flow-map">
                    {BLOCKS.map(b => (
                      <div key={b} id={`stadium-node-${b.replace(/\s+/g, '-').toLowerCase()}`} className="stadium-node p-6 flex flex-col justify-between group hover:accent-border cursor-crosshair relative overflow-hidden bg-white/[0.02]">
                        <div className="absolute top-0 right-0 p-2 opacity-10 font-black italic text-xl group-hover:opacity-20 transition-opacity">{b.replace('Block ', '')}</div>
                        <div className="flex gap-2 flex-wrap max-w-full">
                          {orders.filter(o => o.block === b && o.status !== 'completed').map(o => (
                            <motion.div 
                              layoutId={`order-${o.id}`}
                              key={o.id} 
                              className="w-3.5 h-3.5 bg-red-500 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                            />
                          ))}
                          {vendors.filter(v => v.location === b).map(v => (
                            <motion.div 
                              layoutId={`vendor-${v.id}`}
                              key={v.id} 
                              className="w-3.5 h-3.5 bg-accent rounded-full shadow-[0_0_15px_rgba(0,242,255,0.6)] pulse" 
                            />
                          ))}
                        </div>
                        <div className="mt-4 flex items-end justify-between">
                           <p className="text-[10px] font-mono opacity-20 uppercase font-black">Load: {Math.round(Math.random() * 40 + 60)}%</p>
                           <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 glass-card p-10 flex flex-col" id="admin-alerts-panel">
                  <h3 className="font-display font-black uppercase text-sm mb-8 opacity-60 tracking-[0.2em] flex items-center gap-3">
                    <Bell className="w-4 h-4" /> Logistics Alerts
                  </h3>
                  <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-4" id="alerts-list">
                    {orders.filter(o => o.status !== 'completed').slice(-4).map(order => (
                       <div key={order.id} className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/[0.08] transition-colors group" id={`alert-item-${order.id}`}>
                         <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-mono text-accent font-black">#{order.id} • ZONE {order.block.replace('Block ', '')}</span>
                           <AlertTriangle className={`w-4 h-4 ${order.estimatedPrepTime > 12 ? 'text-red-500 animate-pulse' : 'text-white/10'}`} />
                         </div>
                         <div className="grid grid-cols-1 gap-2">
                           <button 
                             id={`pace-btn-${order.id}`}
                             onClick={() => sendAdminMessage(order.id, "High pressure match, please pick up pace!")}
                             className="text-[9px] font-black py-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all uppercase tracking-widest"
                           >
                             URGENT PACE
                           </button>
                           <button 
                             id={`quality-btn-${order.id}`}
                             onClick={() => sendAdminMessage(order.id, "Kitchen check OK, maintain presentation.")}
                             className="text-[9px] font-black py-2.5 bg-accent/10 text-accent rounded-xl border border-accent/20 hover:bg-accent/20 transition-all uppercase tracking-widest"
                           >
                             QUALITY PASS
                           </button>
                         </div>
                       </div>
                    ))}
                    {orders.filter(o => o.status !== 'completed').length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-20" id="alerts-empty">
                         <CheckCircle2 className="w-12 h-12 mb-4" />
                         <p className="text-[10px] uppercase font-black tracking-widest">No alerts</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8" id="admin-feedback-section">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <h3 className="font-display font-black text-3xl italic uppercase tracking-tighter">Fan Feedback Loop</h3>
                  <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-[10px] font-black text-accent uppercase tracking-widest">LIVE DATA</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" id="feedback-grid">
                  {orders.filter(o => o.feedback).slice(-4).map(o => (
                    <motion.div 
                      whileHover={{ y: -5 }}
                      key={o.id} 
                      className="glass-card p-8 border-l-4 border-accent/40 relative group overflow-hidden"
                      id={`feedback-card-${o.id}`}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Star className="w-12 h-12" />
                      </div>
                      <div className="flex gap-1.5 mb-5">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} className={`w-4 h-4 ${i < (o.feedback?.rating || 0) ? 'text-accent fill-accent' : 'text-white/5'}`} />
                        ))}
                      </div>
                      <p className="text-sm font-medium italic opacity-90 leading-relaxed mb-6 group-hover:text-white transition-colors">"{o.feedback?.comment}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-[10px] font-black">
                           {o.items[0].name.charAt(0)}
                        </div>
                        <p className="text-[10px] font-mono uppercase text-white/30 tracking-tighter font-bold">{o.items[0].name} • ZONE {o.block.replace('Block ', '')}</p>
                      </div>
                    </motion.div>
                  ))}
                  {orders.filter(o => o.feedback).length === 0 && <div className="col-span-4 py-20 text-center glass-card border-dashed opacity-30 font-mono text-[10px] uppercase tracking-[0.5em]" id="feedback-waiting">Waiting for sentiment analysis...</div>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>

      {/* Feedback Modal Overlay */}
      {feedbackOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6" id="feedback-modal-overlay">
          <motion.div 
            id="feedback-modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card max-w-sm w-full p-10 space-y-8"
          >
            <div className="text-center">
              <h3 className="text-3xl font-display font-black italic mb-2">Taste Check</h3>
              <p className="text-sm opacity-60">Help our AI suggest only the best!</p>
            </div>
            
            <div className="flex justify-center gap-3" id="rating-stars-container">
               {[1, 2, 3, 4, 5].map(s => (
                 <button key={s} id={`rating-star-${s}`} onClick={() => setRating(s)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${rating >= s ? 'bg-accent text-black rotate-12 scale-110' : 'bg-white/5 hover:bg-white/10'}`}>
                    <Star className={`w-6 h-6 ${rating >= s ? 'fill-current' : ''}`} />
                 </button>
               ))}
            </div>

            <textarea 
              id="feedback-comment-textarea"
              placeholder="Was it hot? Tasty? Too spicy?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-accent/40 min-h-[100px]"
            />

            <button 
              id="submit-feedback-btn"
              disabled={!rating}
              onClick={submitFeedback}
              className="w-full bg-accent text-black font-black py-4 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              SUBMIT SENTIMENT
            </button>
          </motion.div>
        </div>
      )}

      {/* Cart Indicator Overlay */}
      {role === 'spectator' && cart.length > 0 && !isOrdering && (
        <motion.div 
          id="fixed-cart-indicator"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-accent text-black p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,242,255,0.4)] flex justify-between items-center z-50 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShoppingCart className="w-16 h-16 -rotate-12" />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg" id="cart-count-badge">
              {cart.reduce((acc, curr) => acc + curr.quantity, 0)}
            </div>
            <div>
              <p className="font-display font-black text-xs uppercase tracking-widest opacity-60">Pending Dispatch</p>
              <p className="text-2xl font-black italic" id="cart-price-preview">₹{cart.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0)}</p>
            </div>
          </div>
          <button 
            id="review-basket-btn"
            onClick={() => {
              const el = document.getElementById('spectator-cart-card');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-black text-accent px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all relative z-10"
          >
            REVIEW
          </button>
        </motion.div>
      )}
    </div>
  );
}
