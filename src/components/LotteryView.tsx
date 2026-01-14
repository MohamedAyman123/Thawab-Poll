
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Participant } from '../App';

interface LotteryViewProps {
  participants: Participant[];
  onBack: () => void;
  onRemoveWinnerCenter: (winner: Participant) => void;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; size: number; color: string; life: number;
}

const LotteryView: React.FC<LotteryViewProps> = ({ participants, onBack, onRemoveWinnerCenter }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [displayList, setDisplayList] = useState<Participant[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  
  const requestRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  
  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playTickSound = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, []);

  const playWinSound = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(523.25, now, 0.5); // C5
    playNote(659.25, now + 0.1, 0.5); // E5
    playNote(783.99, now + 0.2, 0.6); // G5
    playNote(1046.50, now + 0.3, 0.8); // C6
  }, []);

  useEffect(() => {
    if (participants.length === 0) return;
    const padded = [];
    const targetCount = 1500;
    const reps = Math.max(10, Math.ceil(targetCount / participants.length));
    for (let i = 0; i < reps; i++) padded.push(...participants);
    setDisplayList(padded);
  }, [participants]);

  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesRef.current.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.012;
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    });
    if (particlesRef.current.length > 0 || isSpinning) requestRef.current = requestAnimationFrame(updateParticles);
  }, [isSpinning]);

  const spin = useCallback(() => {
    if (isSpinning || participants.length === 0) return;
    initAudio();
    setIsSpinning(true); setShowWinner(false); setWinner(null); setZoomScale(1);
    
    let speed = 90 + Math.random() * 50;
    let offset = scrollOffset;
    const itemH = 75;
    let lastTickIdx = Math.floor(offset / itemH);

    const animate = () => {
      offset += speed; 
      speed *= 0.988;
      setScrollOffset(offset);

      // Trigger tick sound on threshold cross
      const currentTickIdx = Math.floor(offset / itemH);
      if (currentTickIdx !== lastTickIdx) {
        playTickSound();
        lastTickIdx = currentTickIdx;
      }

      if (speed > 0.15) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false); setZoomScale(1);
        const idx = Math.floor((offset + (itemH * 10)) / itemH) % displayList.length;
        setWinner(displayList[idx]);
      }
    };
    requestRef.current = requestAnimationFrame(animate);
    updateParticles();
  }, [isSpinning, scrollOffset, displayList, participants.length, updateParticles, playTickSound]);

  const handleShow = () => {
    if (winner && !isSpinning) {
      initAudio();
      playWinSound();
      setShowWinner(true); setZoomScale(1);
      if (canvasRef.current) {
        for (let i = 0; i < 150; i++) {
          const angle = Math.random() * Math.PI * 2;
          const s = Math.random() * 10 + 2;
          particlesRef.current.push({
            x: canvasRef.current.width / 2, y: canvasRef.current.height / 2,
            vx: Math.cos(angle) * s, vy: Math.sin(angle) * s,
            size: Math.random() * 6 + 2, color: i % 2 === 0 ? '#fbbf24' : '#10b981', life: 1.0
          });
        }
        updateParticles();
      }
    }
  };

  const itemHeight = 75;
  const listHeight = displayList.length * itemHeight;
  const activeCentersCount = new Set(participants.map(p => p.center)).size;

  return (
    <div className="relative w-full max-w-6xl h-[92vh] flex flex-col items-center bg-emerald-50/90 backdrop-blur-md p-8 rounded-[4rem] border-[16px] border-emerald-100/50 shadow-[0_40px_120px_rgba(6,78,59,0.2)] overflow-hidden font-['Cairo']">
      
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50" width={window.innerWidth} height={window.innerHeight} />

      {/* Header Section */}
      <div className="w-full flex justify-between items-start mb-10 z-40 px-4">
        <div className="space-y-1">
          <h1 className="text-6xl font-black text-emerald-900 tracking-tighter leading-none">سحب العمرة</h1>
          <div className="flex gap-4">
            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-red-100">
              الأسماء: {participants.length}
            </span>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200">
              المراكز المتبقية: {activeCentersCount}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
            <div className="relative group flex flex-col items-center">
                <span className="text-emerald-700 text-5xl font-black leading-none drop-shadow-sm">ثواب</span>
                <span className="text-[10px] tracking-[0.6em] text-emerald-600/60 font-bold mt-1 uppercase">THAWAB</span>
            </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-between gap-10 relative">
        
        {/* Controls: Left */}
        <div className="flex flex-col items-center gap-8 z-40 w-48 order-2 md:order-1">
          <button
            onClick={spin}
            disabled={isSpinning || participants.length === 0}
            className={`group relative w-36 h-36 rounded-full flex flex-col items-center justify-center font-black text-white shadow-2xl transition-all active:scale-90 border-[10px] border-white ${
              isSpinning || participants.length === 0 ? 'bg-slate-200 cursor-not-allowed opacity-50' : 'bg-gradient-to-tr from-emerald-600 to-green-500 hover:scale-105 shadow-emerald-100'
            }`}
          >
            <span className="text-3xl relative z-10">سحب</span>
          </button>
          <button onClick={onBack} className="text-emerald-600 hover:text-emerald-800 font-bold text-xs transition-colors uppercase tracking-widest pb-1 border-b border-transparent hover:border-emerald-800">تعديل البيانات</button>
        </div>

        {/* The Reel: Center */}
        <div 
          className="relative flex-1 h-full max-h-[550px] w-full flex flex-col items-center justify-center perspective-1000 order-1 md:order-2 transition-all duration-700 ease-out"
          style={{ transform: `scale(${zoomScale})` }}
        >
          {/* Winner Focal Box */}
          <div className={`absolute z-30 w-full max-w-xl h-28 border-[8px] rounded-[3rem] flex items-center justify-center pointer-events-none transition-all duration-500 shadow-xl ${
            showWinner ? 'border-emerald-500 bg-white shadow-emerald-200' : 'border-emerald-100/50 bg-white/70 backdrop-blur-lg'
          }`}>
             {showWinner && winner ? (
               <div className="flex flex-col items-center animate-in zoom-in duration-500">
                 <span className="text-3xl font-black text-emerald-800 drop-shadow-sm">{winner.name}</span>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-emerald-600 font-black uppercase tracking-[0.2em]">{winner.center}</span>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-3">
                 {isSpinning ? (
                    <span className="text-emerald-300 font-black text-3xl animate-pulse tracking-tighter">جاري الاختيار...</span>
                 ) : (
                    <span className="text-emerald-100 font-black text-6xl">؟</span>
                 )}
               </div>
             )}
          </div>

          {/* Names Reel List */}
          <div className="w-full h-full overflow-hidden flex flex-col items-center relative mask-fade-edges">
            <div 
              className="flex flex-col items-center w-full"
              style={{ 
                transform: `translateY(${- (scrollOffset % (listHeight || 1))}px)`,
                transition: isSpinning ? 'none' : 'transform 1.5s cubic-bezier(0.1, 0.8, 0.2, 1)'
              }}
            >
              {displayList.map((p, idx) => {
                const itemY = (idx * itemHeight) - (scrollOffset % (listHeight || 1));
                const dist = Math.abs(itemY);
                const isCenter = dist < 30;
                
                return (
                  <div 
                    key={`${p.name}-${idx}`}
                    className={`h-[75px] flex flex-col items-center justify-center transition-all duration-300 ${
                      !isCenter ? 'opacity-20 scale-75 blur-[2px]' : 'opacity-100 scale-100 blur-0'
                    }`}
                    style={{ 
                        filter: (!showWinner && !isSpinning && isCenter) ? 'blur(25px)' : 'none',
                        visibility: (showWinner && isCenter) ? 'hidden' : 'visible'
                    }}
                  >
                    <span className="text-3xl font-black text-red-600 leading-none drop-shadow-sm">{p.name}</span>
                    <span className="text-[8px] text-emerald-600 font-bold mt-1 uppercase tracking-widest">{p.center}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-50/80 to-transparent z-20 pointer-events-none"></div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-emerald-50/80 to-transparent z-20 pointer-events-none"></div>
        </div>

        {/* Controls: Right */}
        <div className="flex flex-col items-center gap-8 z-40 w-48 order-3">
          {!showWinner ? (
            <button
              onClick={handleShow}
              disabled={isSpinning || !winner}
              className={`group relative w-36 h-36 rounded-full flex items-center justify-center font-black text-white shadow-2xl transition-all active:scale-90 border-[10px] border-white ${
                isSpinning || !winner ? 'bg-slate-200 cursor-not-allowed opacity-50' : 'bg-gradient-to-br from-emerald-700 to-emerald-900 hover:scale-105 shadow-emerald-200'
              }`}
            >
              <span className="text-3xl relative z-10">كشف</span>
            </button>
          ) : (
            <button
              onClick={() => { onRemoveWinnerCenter(winner!); setWinner(null); setShowWinner(false); }}
              className="group w-36 h-36 rounded-full flex flex-col items-center justify-center font-black text-white shadow-2xl bg-gradient-to-br from-orange-500 to-red-600 hover:scale-110 border-[10px] border-white transition-all animate-bounce shadow-orange-100"
            >
              <span className="text-xl text-center leading-tight">تأكيد حذف المركز</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .mask-fade-edges {
          mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
        }
        .perspective-1000 {
          perspective: 2500px;
        }
      `}</style>
    </div>
  );
};

export default LotteryView;
