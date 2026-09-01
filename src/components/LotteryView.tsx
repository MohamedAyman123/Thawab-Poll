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
const [isNasheedPlaying, setIsNasheedPlaying] = useState(false);

  const remainingCenters = new Set(
  participants
    .map(p => p.center)
    .filter(Boolean)
).size;

  const reelRef = useRef<HTMLDivElement>(null);
  const lastOffsetRef = useRef(0);

  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const applauseRef = useRef<HTMLAudioElement | null>(null);
  const nasheedRef = useRef<HTMLAudioElement | null>(null);

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

  /* ------------------ Spin Logic ------------------ */
  const spin = useCallback(() => {
    if (isSpinning || participants.length === 0) return;

    setIsSpinning(true);
    setShowWinner(false);
    setWinner(null);

    // 🔊 صوت العجلة
    if (spinSoundRef.current) {
  spinSoundRef.current.currentTime = 0;
  spinSoundRef.current.volume = 1;

  const playPromise = spinSoundRef.current.play();

  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.error("فشل تشغيل صوت السحب:", error);
    });
  }
}
    const shuffled = shuffleArray(participants);
    const winnerIndex = secureRandomInt(shuffled.length);
    const selectedWinner = shuffled[winnerIndex];

    const baseIndex =
      displayList.length - shuffled.length + winnerIndex;

    const targetOffset =
      baseIndex * ITEM_HEIGHT - VIEWPORT_CENTER_OFFSET;

    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min(
        (now - start) / SPIN_DURATION,
        1
      );

      let offset: number;

      if (progress < SNAP_THRESHOLD) {
        const local = progress / SNAP_THRESHOLD;
        offset = targetOffset * local * local;
        lastOffsetRef.current = offset;
      } else {
        const snap =
          (progress - SNAP_THRESHOLD) /
          (1 - SNAP_THRESHOLD);
        offset =
          lastOffsetRef.current +
          (targetOffset - lastOffsetRef.current) * snap;
      }

      if (reelRef.current) {
        reelRef.current.style.transform =
          `translateY(-${offset}px)`;
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

  const activeCentersCount = new Set(
    participants.map(p => p.center)
  ).size;

  /* ------------------ UI ------------------ */
  return (
    <div
  className="relative min-h-screen w-full flex flex-col items-center overflow-hidden font-['Cairo'] bg-cover bg-center"
  style={{ backgroundImage: `url(${base}background.png)` }}
>
      
{/* <div className="absolute inset-0 z-0 bg-emerald-50/80 backdrop-blur-sm" /> */}
      {/* أصوات */}
      <audio
  ref={spinSoundRef}
  src={`${base}sounds/wheel.mp3`}
  loop
  preload="auto"
/>
<audio
  ref={nasheedRef}
  src={`${base}sounds/nasheed.mp3`}
  preload="auto"
/>
      <audio ref={applauseRef} src="/sounds/applause.mp3" />

      {/* Header */}
      <div className="w-full flex justify-between items-start px-16 mb-6 z-10">
        <div className="mt-4">
          <h1 className="text-4xl font-black text-white">
  سـحـب العمــرة
</h1>

<h2 className="text-3xl font-black text-white text-center mt-1">
  معلمين ومعلمات
</h2>
          
        </div>
        <img
  src={`${base}new-logo.png`}
  alt="القرآن يجمعنا"
className="w-44 h-auto object-contain mt-6"/>
      </div>
{!isSpinning && !winner && (
  <div className="text-center text-white mb-8 z-10">
    <div className="text-4xl md:text-5xl font-black drop-shadow-lg">
      بسم الله نبدأ سحب العمرة
    </div>

    <div className="text-xl md:text-2xl font-bold mt-2 opacity-90 drop-shadow-md">
      نسأل الله أن يكتبها نصيبًا مباركًا للفائز
    </div>
  </div>
)}
<div className="relative flex-1 w-full max-w-7xl flex items-center justify-between z-10 bg-white/25 backdrop-blur-sm rounded-[2.5rem] border border-white/40 shadow-2xl px-10 py-10"><div className="absolute top-6 right-8 flex gap-4">
  <span className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-lg font-black shadow-md">
    الأسماء: {participants.length}
  </span>

  <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-lg font-black shadow-md">
    المراكز المتبقية: {activeCentersCount}
  </span>
</div>
        {/* Left */}
        <div className="flex flex-col items-center gap-6 w-48">
          <button
            onClick={spin}
            disabled={isSpinning}
            className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black text-4xl shadow-2xl border-4 border-white/30 hover:scale-105 transition-transform disabled:opacity-40"
          >
            سحب
          </button>
          <button onClick={onBack} className="text-emerald-700 font-bold text-xs">
            تعديل البيانات
          </button>
          <button
  onClick={() => {
    if (!nasheedRef.current) return;

    if (nasheedRef.current.paused) {
      nasheedRef.current.play().catch((error) => {
        console.error("فشل تشغيل النشيد:", error);
      });
      setIsNasheedPlaying(true);
    } else {
      nasheedRef.current.pause();
      setIsNasheedPlaying(false);
    }
  }}
  className="mt-2 px-5 py-2 rounded-full bg-white/80 text-emerald-900 font-black shadow-lg hover:scale-105 transition-transform"
>
  {isNasheedPlaying ? "⏸ إيقاف النشيد" : "▶ تشغيل النشيد"}
</button>
        </div>

        {/* Reel */}
        <div className="relative flex-1 max-h-[550px] overflow-hidden">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 w-full h-28 border-[8px] rounded-[3rem] border-emerald-500 bg-white flex items-center justify-center">
            {showWinner && winner ? (
  <div className="text-center winner-pop">
    <div className="text-4xl md:text-5xl font-black text-emerald-900">
      {winner.name}
    </div>

    <div className="text-2xl md:text-3xl font-black text-emerald-700 mt-2">
      {winner.center}
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
                  className="h-[75px] flex flex-col items-center justify-center opacity-50"
                >
                  <span className="text-3xl font-black text-emerald-950/80">
                    {p.name}
                  </span>
                  <span className="text-[8px] font-bold text-emerald-950">
                    {p.center}
                  </span>
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

if (nasheedRef.current) {
  nasheedRef.current.currentTime = 0;
  nasheedRef.current.volume = 1;

  nasheedRef.current.play().catch((error) => {
    console.error("فشل تشغيل النشيد:", error);
  });
  setIsNasheedPlaying(true);
}
              }}
              disabled={!winner || isSpinning}
              className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 text-white font-black text-4xl shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform disabled:opacity-40"
            >
              كشف
            </button>
          ) : (
            <button
              onClick={() => {
                if (!winner) return;
                onRemoveWinnerCenter(winner);
                setWinner(null);
                setShowWinner(false);
              }}
              className="w-36 h-36 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white font-black text-sm"
            >
              تأكيد حذف المركز
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LotteryView;
