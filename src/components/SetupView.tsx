
import React, { useState, useEffect } from 'react';
import { Participant } from '../App';

interface SetupViewProps {
  onStart: (participants: Participant[]) => void;
  initialParticipants: Participant[];
}

const SetupView: React.FC<SetupViewProps> = ({ onStart, initialParticipants }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (initialParticipants.length > 0) {
      const centersMap: Record<string, string[]> = {};
      initialParticipants.forEach(p => {
        if (!centersMap[p.center]) centersMap[p.center] = [];
        centersMap[p.center].push(p.name);
      });
      
      const text = Object.entries(centersMap)
        .map(([center, names]) => `[${center}]\n${names.join('\n')}`)
        .join('\n---\n');
      setInputValue(text);
    }
  }, [initialParticipants]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result: Participant[] = [];
    const blocks = inputValue.split('---');
    
    blocks.forEach(block => {
      const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l !== '');
      if (lines.length > 0) {
        let currentCenter = 'مركز غير معروف';
        let startIndex = 0;
        if (lines[0].startsWith('[') && lines[0].endsWith(']')) {
          currentCenter = lines[0].substring(1, lines[0].length - 1);
          startIndex = 1;
        } else {
          currentCenter = lines[0];
          startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
          result.push({ name: lines[i], center: currentCenter });
        }
      }
    });

    if (result.length === 0) {
      alert('يرجى إدخال المراكز والأسماء بشكل صحيح');
      return;
    }

    onStart(result);
  };

  return (
    <div className="bg-emerald-50/95 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl w-full max-w-3xl border border-emerald-200 font-['Cairo']">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black text-emerald-900 tracking-tighter">إعداد المراكز</h1>
        <div className="w-24 h-24 relative flex items-center justify-center">
           <div className="flex flex-col items-center">
              <span className="text-emerald-700 text-4xl font-black leading-none">ثواب</span>
              <span className="text-[10px] tracking-[0.4em] text-emerald-600/60 font-bold uppercase">THAWAB</span>
           </div>
        </div>
      </div>

      <div className="bg-emerald-100/50 p-4 rounded-2xl mb-6 text-sm text-emerald-800 leading-relaxed border border-emerald-200/50">
        <p className="font-bold mb-2 text-emerald-900">طريقة الإدخال:</p>
        <code className="block bg-white/50 p-2 rounded-lg text-xs font-mono text-emerald-700">
          [اسم المركز]<br/>
          الاسم الأول<br/>
          الاسم الثاني<br/>
          ---
        </code>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <textarea
          className="w-full h-80 p-6 border-2 border-emerald-100 rounded-3xl focus:border-emerald-500 focus:ring-0 transition-all text-right resize-none font-medium text-lg shadow-inner bg-white/80"
          placeholder="اكتب المراكز والأسماء هنا..."
          dir="rtl"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl active:scale-95 text-xl"
        >
          اعتماد وحفظ القائمة
        </button>
      </form>
    </div>
  );
};

export default SetupView;
