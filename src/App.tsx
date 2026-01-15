import React, { useState, useEffect } from 'react';
import SetupView from './components/SetupView';
import LotteryView from './components/LotteryView';
import { defaultNames } from "./data/defaultNames";

export enum AppView {
  SETUP = 'SETUP',
  LOTTERY = 'LOTTERY'
}

export interface Participant {
  name: string;
  center?: string; // أصبح اختياري (لم نعد نستخدمه في القرعة)
}

const STORAGE_KEY = 'thawab_lottery_participants';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.SETUP);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // تحميل البيانات المحفوظة
  useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);

  // ✅ إذا يوجد بيانات محفوظة استخدمها
  if (saved) {
    try {
      setParticipants(JSON.parse(saved));
      return;
    } catch (e) {
      console.error("Error loading participants:", e);
    }
  }

  // ✅ إذا لا يوجد بيانات: حمّل الأسماء الافتراضية
  const initial = defaultNames.map((name) => ({
    name,
    center: "" // لو أنت مازلت تستخدم Participant فيه center
  }));

  setParticipants(initial);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
}, []);

  const handleStartLottery = (newParticipants: Participant[]) => {
    setParticipants(newParticipants);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newParticipants));
    setView(AppView.LOTTERY);
  };

  // ✅ حذف الفائز نفسه فقط (بدون حذف المركز بالكامل)
  const handleRemoveWinner = (winner: Participant) => {
    const updated = participants.filter((p, idx) => {
      // حذف أول تطابق للاسم فقط (لتجنب حذف أشخاص بنفس الاسم إذا تكرر)
      return !(p.name === winner.name && idx === participants.findIndex(x => x.name === winner.name));
    });

    setParticipants(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleBackToSetup = () => {
    setView(AppView.SETUP);
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      {view === AppView.SETUP ? (
        <SetupView onStart={handleStartLottery} initialParticipants={participants} />
      ) : (
        <LotteryView
          participants={participants}
          onBack={handleBackToSetup}
          onRemoveWinnerCenter={handleRemoveWinner}
        />
      )}
    </div>
  );
};

export default App;
