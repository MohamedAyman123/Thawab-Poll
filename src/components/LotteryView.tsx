import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import { Participant } from '../App';

const base = import.meta.env.BASE_URL;

interface LotteryViewProps {
  participants: Participant[];
  onBack: () => void;

  // أبقينا الاسم كما هو لتجنب تغييرات كثيرة في App
  onRemoveWinnerCenter: (winner: Participant) => void;
}

/* ------------------ Constants ------------------ */
const ITEM_HEIGHT = 75;
const SPIN_DURATION = 4000;
const SNAP_THRESHOLD = 0.9;
const VIEWPORT_CENTER_OFFSET = 275 - ITEM_HEIGHT / 2;

/* ------------------ Secure Random ------------------ */
function secureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const LotteryView: React.FC<LotteryViewProps> = ({
  participants,
  onBack,
  onRemoveWinnerCenter
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [displayList, setDisplayList] = useState<Participant[]>([]);

  const reelRef = useRef<HTMLDivElement>(null);
  const lastOffsetRef = useRef(0);

  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const applauseRef = useRef<HTMLAudioElement | null>(null);

  /* ------------------ Build Display List ------------------ */
  useEffect(() => {
    if (!participants.length) return;

    const shuffled = shuffleArray(participants);
    const LOOPS = 12;
    const list: Participant[] = [];

    for (let i = 0; i < LOOPS; i++) {
      list.push(...shuffled);
    }

    setDisplayList(list);
  }, [participants]);
const [celebrate, setCelebrate] = useState(false);

  /* ------------------ Spin Logic ------------------ */
  const spin = useCallback(() => {
    if (isSpinning || participants.length === 0) return;

    setIsSpinning(true);
    setShowWinner(false);
    setWinner(null);

    // 🔊 صوت العجلة
    if (spinSoundRef.current) {
      spinSoundRef.current.currentTime = 0;
      spinSoundRef.current.play();
    }

    const shuffled = shuffleArray(participants);
    const winnerIndex = secureRandomInt(shuffled.length);
    const selectedWinner = shuffled[winnerIndex];

    const baseIndex = displayList.length - shuffled.length + winnerIndex;
    const targetOffset = baseIndex * ITEM_HEIGHT - VIEWPORT_CENTER_OFFSET;

    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - start) / SPIN_DURATION, 1);

      let offset: number;

      if (progress < SNAP_THRESHOLD) {
        const local = progress / SNAP_THRESHOLD;
        offset = targetOffset * local * local;
        lastOffsetRef.current = offset;
      } else {
        const snap = (progress - SNAP_THRESHOLD) / (1 - SNAP_THRESHOLD);
        offset =
          lastOffsetRef.current +
          (targetOffset - lastOffsetRef.current) * snap;
      }

      if (reelRef.current) {
        reelRef.current.style.transform = `translateY(-${offset}px)`;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setWinner(selectedWinner);

        // 🛑 إيقاف صوت العجلة
        if (spinSoundRef.current) {
          spinSoundRef.current.pause();
          spinSoundRef.current.currentTime = 0;
        }
      }
    };

    requestAnimationFrame(animate);
  }, [isSpinning, participants, displayList]);

  /* ------------------ UI ------------------ */
  return (
    <div className="relative w-full max-w-6xl h-[92vh] flex flex-col items-center p-8 rounded-[4rem] overflow-hidden font-['Cairo']">
      {celebrate && (
  <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
    {Array.from({ length: 120 }).map((_, i) => (
      <span
        key={i}
        className="confetti"
        style={{
          left: `${Math.random() * 100}%`,
          background: i % 3 === 0 ? "#10b981" : i % 3 === 1 ? "#fbbf24" : "#ef4444",
          animationDelay: `${Math.random() * 0.4}s`,
        }}
      />
    ))}
  </div>
)}

      <div className="absolute inset-0 z-0 bg-emerald-50/80 backdrop-blur-sm" />

      {/* أصوات */}
      <audio ref={spinSoundRef} src={`${base}sounds/wheel.mp3`} loop />
      {/* <audio ref={applauseRef} src={`${base}sounds/applause.mp3`} /> */}

      {/* Header */}
      <div className="w-full flex justify-between mb-10 z-10">
        <div>
          <h1 className="text-6xl font-black text-emerald-900">سحب العمرة</h1>
          <h2 className="text-4xl font-black text-emerald-900" style={{ textAlign: 'center' }}>
المعلمات والأمهات   
       </h2>

          <div className="flex gap-4 mt-2">
            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black">
              الأسماء المتبقية: {participants.length}
            </span>
          </div>
        </div>

        <img src={`${base}logo2.png`} style={{ width: '8em' }} />
      </div>

      <div className="flex-1 w-full flex items-center justify-between z-10">
        {/* Left */}
        <div className="flex flex-col items-center gap-6 w-48">
          <button
            onClick={spin}
            disabled={isSpinning || participants.length === 0}
            className="w-36 h-36 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white font-black text-3xl shadow-2xl disabled:opacity-40"
          >
            سحب
          </button>
          <button onClick={onBack} className="text-emerald-700 font-bold text-xs">
            تعديل البيانات
          </button>
        </div>

        {/* Reel */}
        <div className="relative flex-1 max-h-[550px] overflow-hidden">
          <div
  className={`absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 w-full h-28 border-[8px] rounded-[3rem] border-emerald-500 bg-white flex items-center justify-center transition-all ${
    showWinner ? "winner-glow punch" : ""
  }`}
>

            {showWinner && winner ? (
  <div className="text-center winner-pop">
    <div className="text-4xl font-black text-emerald-800">
      {winner.name}
    </div>
  </div>
) : (

              <span className="text-emerald-300 text-3xl font-black">
                {isSpinning ? 'جاري الاختيار...' : '؟'}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center">
            <div ref={reelRef} className="flex flex-col items-center">
              {displayList.map((p, i) => (
                <div
                  key={i}
                  className="h-[75px] flex flex-col items-center justify-center opacity-30"
                >
                  <span className="text-3xl font-black text-red-600">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-center gap-6 w-48">
          {!showWinner ? (
            <button
              onClick={() => {
  if (!winner) return;

  setShowWinner(true);

  setCelebrate(true);
  setTimeout(() => setCelebrate(false), 1800);

  if (applauseRef.current) {
    applauseRef.current.currentTime = 0;
    applauseRef.current.play();
  }
}}

              disabled={!winner || isSpinning}
              className="w-36 h-36 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-black text-3xl disabled:opacity-40"
            >
              كشف
            </button>
          ) : (
            <button
              onClick={() => {
                if (!winner) return;

                // ✅ حذف اسم الفائز فقط
                onRemoveWinnerCenter(winner);
                setWinner(null);
                setShowWinner(false);
              }}
              className="w-36 h-36 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white font-black text-sm"
            >
              تأكيد حذف الاسم
            </button>
          )}
        </div>
      </div>
      <style>{`
  @keyframes winnerGlow {
    0% { box-shadow: 0 0 0 rgba(16,185,129,0); }
    50% { box-shadow: 0 0 35px rgba(16,185,129,0.55); }
    100% { box-shadow: 0 0 0 rgba(16,185,129,0); }
  }

  @keyframes winnerPop {
    0% { transform: scale(0.85); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes punch {
    0% { transform: scale(1); }
    30% { transform: scale(1.03); }
    60% { transform: scale(0.99); }
    100% { transform: scale(1); }
  }

  @keyframes confettiFall {
    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(700px) rotate(720deg); opacity: 0; }
  }

  .winner-glow {
    animation: winnerGlow 1.4s ease-in-out infinite;
  }

  .winner-pop {
    animation: winnerPop 450ms ease-out;
  }

  .punch {
    animation: punch 400ms ease-out;
  }

  .confetti {
    position: absolute;
    top: -20px;
    width: 10px;
    height: 18px;
    border-radius: 4px;
    opacity: 0.9;
    animation: confettiFall 1.6s ease-in forwards;
  }
`}</style>

    </div>
  );
};

export default LotteryView;
