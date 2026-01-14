
import React, { useState, useEffect } from 'react';
import SetupView from './components/SetupView';
import LotteryView from './components/LotteryView';
import CatImage from './components/catImage';
export enum AppView {
  SETUP = 'SETUP',
  LOTTERY = 'LOTTERY'
}   

export interface Participant {
  name: string;
  center: string;
}

const STORAGE_KEY = 'thawab_lottery_participants';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.SETUP);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // تحميل البيانات المحفوظة
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setParticipants(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading data", e);
      }
    }
  }, []);

  const handleStartLottery = (newParticipants: Participant[]) => {
    setParticipants(newParticipants);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newParticipants));
    setView(AppView.LOTTERY);
  };

  const handleRemoveCenter = (winner: Participant) => {
    // حذف كل من ينتمي لمركز الفائز
    const updated = participants.filter(p => p.center !== winner.center);
    setParticipants(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleBackToSetup = () => {
    setView(AppView.SETUP);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {view === AppView.SETUP ? (
        <SetupView onStart={handleStartLottery} initialParticipants={participants} />
      ) : (
        <LotteryView 
          participants={participants} 
          onBack={handleBackToSetup} 
          onRemoveWinnerCenter={handleRemoveCenter} 
        />
      )}
    </div>
  );
};

export default App;


