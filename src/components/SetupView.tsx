import React, { useState, useEffect } from 'react';
import { Participant } from '../App';

interface SetupViewProps {
  onStart: (participants: Participant[]) => void;
  initialParticipants: Participant[];
}

const base = import.meta.env.BASE_URL;

const SetupView: React.FC<SetupViewProps> = ({ onStart, initialParticipants }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (initialParticipants.length > 0) {
      // ✅ عرض الأسماء فقط
      const text = initialParticipants.map(p => p.name).join('\n');
      setInputValue(text);
    }
  }, [initialParticipants]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lines = inputValue
      .split('\n')
      .map(l => l.trim())
      .filter(l => l !== '');

    const result: Participant[] = lines.map(name => ({
      name,
      center: '' // اختياري فقط لعدم كسر النوع القديم
    }));

    if (result.length === 0) {
      alert('يرجى إدخال الأسماء بشكل صحيح');
      return;
    }

    onStart(result);
  };

  return (
    <div className="bg-emerald-50/95 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl w-full max-w-3xl border border-emerald-200 font-['Cairo']">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black text-emerald-900 tracking-tighter">إعداد الأسماء</h1>
        <div className="w-24 h-24 relative flex items-center justify-center">
          <div className="flex flex-col items-center">
            <img src={`${base}logo2.png`} alt="Logo" />
          </div>
        </div>
      </div>

      <div className="bg-emerald-100/50 p-4 rounded-2xl mb-6 text-sm text-emerald-800 leading-relaxed border border-emerald-200/50">
        <p className="font-bold mb-2 text-emerald-900">طريقة الإدخال:</p>
        <code className="block bg-white/50 p-2 rounded-lg text-xs font-mono text-emerald-700">
          اكتب كل اسم في سطر مستقل<br />
          مثال:<br />
          محمد أحمد<br />
          أحمد علي<br />
          محمود حسن
        </code>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <textarea
          className="w-full h-80 p-6 border-2 border-emerald-100 rounded-3xl focus:border-emerald-500 focus:ring-0 transition-all text-right resize-none font-medium text-lg shadow-inner bg-white/80"
          placeholder="اكتب الأسماء هنا..."
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
