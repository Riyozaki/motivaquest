
import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Crown, AlertCircle, Heart, Zap, Sword, Battery } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { finishCampaign } from '../store/userSlice';
import confetti from 'canvas-confetti';

Modal.setAppElement('#root');

const BOSS_QUESTIONS = [
  // MATH
  { q: "9 × 7 = ?", opts: ["63","56","72","81"], correct: 0, cat: "math", dmg: 25 },
  { q: "√169 = ?", opts: ["13","11","12","14"], correct: 0, cat: "math", dmg: 30 },
  { q: "15% от 400 = ?", opts: ["60","40","80","45"], correct: 0, cat: "math", dmg: 30 },
  { q: "(a+b)² = ?", opts: ["a²+2ab+b²","a²+b²","2ab","a²+ab+b²"], correct: 0, cat: "math", dmg: 35 },
  { q: "Площадь круга: S = ?", opts: ["πr²","2πr","πd","r²"], correct: 0, cat: "math", dmg: 35 },
  { q: "x²-25 = ?", opts: ["(x-5)(x+5)","(x-5)²","x(x-25)","(x+5)²"], correct: 0, cat: "math", dmg: 40 },
  { q: "sin(90°) = ?", opts: ["1","0","-1","0.5"], correct: 0, cat: "math", dmg: 40 },
  { q: "2⁸ = ?", opts: ["256","128","512","64"], correct: 0, cat: "math", dmg: 30 },
  
  // RUSSIAN
  { q: "Как правильно?", opts: ["Участвовать","Учавствовать","Участвывать","Учавстовать"], correct: 0, cat: "russian", dmg: 25 },
  { q: "НН или Н? Стекля__ый", opts: ["НН","Н"], correct: 0, cat: "russian", dmg: 30 },
  { q: "ПРЕ или ПРИ? ...ехать", opts: ["ПРИ","ПРЕ"], correct: 0, cat: "russian", dmg: 25 },
  { q: "Подлежащее в 'Идёт дождь'?", opts: ["Дождь","Идёт","Нет подлежащего","Идёт дождь"], correct: 0, cat: "russian", dmg: 30 },
  { q: "НЕ с глаголами пишется...", opts: ["Раздельно","Слитно","По-разному","Через дефис"], correct: 0, cat: "russian", dmg: 25 },
  
  // SCIENCE
  { q: "Формула воды?", opts: ["H₂O","CO₂","NaCl","O₂"], correct: 0, cat: "science", dmg: 25 },
  { q: "F = m × a — чей закон?", opts: ["Ньютона","Архимеда","Ома","Паскаля"], correct: 0, cat: "science", dmg: 30 },
  { q: "Сколько хромосом у человека?", opts: ["46","23","48","44"], correct: 0, cat: "science", dmg: 35 },
  { q: "pH = 7 — это...", opts: ["Нейтральная среда","Кислая","Щелочная","Опасная"], correct: 0, cat: "science", dmg: 30 },
  { q: "Единица силы тока?", opts: ["Ампер","Вольт","Ом","Ватт"], correct: 0, cat: "science", dmg: 25 },
  { q: "Митохондрии — это...", opts: ["Энергостанции клетки","Часть мозга","Бактерии","Вирусы"], correct: 0, cat: "science", dmg: 30 },
  { q: "Фотосинтез выделяет...", opts: ["Кислород","CO₂","Азот","Водород"], correct: 0, cat: "science", dmg: 25 },
  
  // HISTORY
  { q: "Крещение Руси — год?", opts: ["988","1054","862","1147"], correct: 0, cat: "history", dmg: 30 },
  { q: "Кто основал СПб?", opts: ["Пётр I","Екатерина II","Иван Грозный","Ленин"], correct: 0, cat: "history", dmg: 25 },
  { q: "Начало ВОВ?", opts: ["22 июня 1941","1 сентября 1939","9 мая 1945","1 января 1942"], correct: 0, cat: "history", dmg: 30 },
  { q: "Отмена крепостного права?", opts: ["1861","1812","1917","1905"], correct: 0, cat: "history", dmg: 30 },
  
  // ENGLISH
  { q: "She ___ a doctor (to be)", opts: ["is","am","are","be"], correct: 0, cat: "lang", dmg: 25 },
  { q: "Past Simple: go → ?", opts: ["went","goed","gone","going"], correct: 0, cat: "lang", dmg: 30 },
  { q: "'Knowledge' = ?", opts: ["Знание","Нож","Колено","Стук"], correct: 0, cat: "lang", dmg: 25 },
  { q: "I have ___ eaten (Present Perfect)", opts: ["already","yesterday","tomorrow","now"], correct: 0, cat: "lang", dmg: 30 },
  
  // LITERATURE
  { q: "Автор 'Мёртвых душ'?", opts: ["Гоголь","Пушкин","Толстой","Чехов"], correct: 0, cat: "lit", dmg: 25 },
  { q: "'Золотая осень' — это...", opts: ["Эпитет","Метафора","Олицетворение","Сравнение"], correct: 0, cat: "lit", dmg: 30 },
  
  // LOGIC/GENERAL
  { q: "Продолжи: 2, 4, 8, 16, ?", opts: ["32","24","20","64"], correct: 0, cat: "logic", dmg: 25 },
  { q: "Сколько минут в 2.5 часах?", opts: ["150","120","130","200"], correct: 0, cat: "logic", dmg: 20 },
  { q: "1 км = ? метров", opts: ["1000","100","10000","500"], correct: 0, cat: "logic", dmg: 20 },
];

interface BossBattleModalProps {
    isOpen: boolean;
    onClose: () => void;
    allies: string[];
}

interface Question {
    q: string;
    opts: string[];
    correct: number;
    cat: string;
    dmg: number;
}

const BossBattleModal: React.FC<BossBattleModalProps> = ({ isOpen, onClose, allies }) => {
    const dispatch = useDispatch<AppDispatch>();
    
    // Stats
    const maxPlayerHp = 150;
    const maxBossHp = 400;
    
    const [playerHp, setPlayerHp] = useState(maxPlayerHp);
    const [bossHp, setBossHp] = useState(maxBossHp);
    const [turn, setTurn] = useState<'player' | 'boss' | 'win' | 'lose'>('player');
    const [logs, setLogs] = useState<string[]>([]);
    
    // Ally Charges: Wizard (2), Fairy (1), Warrior (1)
    const [allyCharges, setAllyCharges] = useState<{ [key: string]: number }>({
        wizard: 2,
        fairy: 1,
        warrior: 1
    });
    
    // Question State
    const [currentQ, setCurrentQ] = useState<Question | null>(null);
    const [disabledOpts, setDisabledOpts] = useState<number[]>([]);
    const [dmgMultiplier, setDmgMultiplier] = useState(1);
    
    // Visuals
    const [bossFlash, setBossFlash] = useState(false);
    const [playerFlash, setPlayerFlash] = useState(false);

    useEffect(() => {
        if (isOpen) {
            resetBattle();
            nextQuestion();
        }
    }, [isOpen]);

    const resetBattle = () => {
        setPlayerHp(maxPlayerHp);
        setBossHp(maxBossHp);
        setTurn('player');
        setLogs(["Король Лени: 'Докажи, что твои знания чего-то стоят!'"]);
        setDisabledOpts([]);
        setDmgMultiplier(1);
        setBossFlash(false);
        setPlayerFlash(false);
        setAllyCharges({ wizard: 2, fairy: 1, warrior: 1 });
    };

    const nextQuestion = () => {
        const idx = Math.floor(Math.random() * BOSS_QUESTIONS.length);
        setCurrentQ(BOSS_QUESTIONS[idx]);
        setDisabledOpts([]);
    };

    const handleAnswer = (idx: number) => {
        if (turn !== 'player' || !currentQ) return;

        if (idx === currentQ.correct) {
            // Correct
            const dmg = Math.floor(currentQ.dmg * dmgMultiplier);
            setBossHp(prev => Math.max(0, prev - dmg));
            setBossFlash(true);
            setTimeout(() => setBossFlash(false), 200);
            setLogs(prev => [`Вы нанесли ${dmg} урона знаниями!`, ...prev].slice(0, 4));
            setDmgMultiplier(1); // Reset multiplier
            
            if (bossHp - dmg <= 0) {
                setTurn('win');
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
            } else {
                setTurn('boss');
                setTimeout(bossTurn, 1500);
            }
        } else {
            // Incorrect
            setLogs(prev => [`Ошибка! Правильно: ${currentQ.opts[currentQ.correct]}`, ...prev].slice(0, 4));
            setTurn('boss');
            setTimeout(bossTurn, 1500);
        }
    };

    const bossTurn = () => {
        const dmg = Math.floor(Math.random() * 20) + 15;
        setPlayerHp(prev => Math.max(0, prev - dmg));
        setPlayerFlash(true);
        setTimeout(() => setPlayerFlash(false), 200);
        setLogs(prev => [`Король Лени атакует! -${dmg} HP`, ...prev].slice(0, 4));
        
        if (playerHp - dmg <= 0) {
            setTurn('lose');
        } else {
            setTurn('player');
            nextQuestion();
        }
    };

    // Ally Abilities
    const useAlly = (ally: string) => {
        if (!currentQ || turn !== 'player') return;
        if (allyCharges[ally] <= 0) return;

        // Decrement charge
        setAllyCharges(prev => ({ ...prev, [ally]: prev[ally] - 1 }));

        if (ally === 'wizard') {
            // Remove 1 wrong option
            const wrongOpts = currentQ.opts.map((_, i) => i).filter(i => i !== currentQ.correct && !disabledOpts.includes(i));
            if (wrongOpts.length > 0) {
                const toRemove = wrongOpts[Math.floor(Math.random() * wrongOpts.length)];
                setDisabledOpts(prev => [...prev, toRemove]);
                setLogs(prev => [`🧙‍♂️ Волшебник убрал неверный вариант! (Ост: ${allyCharges['wizard'] - 1})`, ...prev].slice(0, 4));
            }
        }
        if (ally === 'fairy') {
            setPlayerHp(prev => Math.min(maxPlayerHp, prev + 30));
            setLogs(prev => [`🧚‍♀️ Фея восстановила 30 HP! (Ост: ${allyCharges['fairy'] - 1})`, ...prev].slice(0, 4));
        }
        if (ally === 'warrior') {
            setDmgMultiplier(2);
            setLogs(prev => [`🛡️ Воин: Следующий удар нанесет двойной урон! (Ост: ${allyCharges['warrior'] - 1})`, ...prev].slice(0, 4));
        }
    };

    const handleVictory = () => {
        dispatch(finishCampaign());
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            className="outline-none focus:outline-none"
            style={{
                overlay: { backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
                content: { position: 'relative', inset: 'auto', border: 'none', background: 'transparent', padding: 0, width: '100%', maxWidth: '700px' }
            }}
        >
            <div className="relative w-full bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                {/* Visuals */}
                <div className={`relative h-64 bg-slate-900 flex justify-between items-end p-8 transition-colors ${playerFlash ? 'bg-red-900/50' : ''}`}>
                     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black opacity-80"></div>
                     
                     {/* Player */}
                     <div className="relative z-10">
                        <div className="w-32">
                            <div className="flex justify-between text-xs font-bold text-emerald-400 mb-1">
                                <span>Герой</span>
                                <span>{playerHp}/{maxPlayerHp}</span>
                            </div>
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
                                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(playerHp/maxPlayerHp)*100}%` }}></div>
                            </div>
                        </div>
                     </div>

                     {/* Boss */}
                     <div className="relative z-10 flex flex-col items-center">
                         <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all ${bossFlash ? 'bg-red-500 scale-110' : 'bg-slate-800 border-red-900'}`}>
                             <Skull size={64} className="text-red-500" />
                         </div>
                         <div className="w-48 mt-4">
                            <div className="flex justify-between text-xs font-bold text-red-400 mb-1">
                                <span>Король Лени</span>
                                <span>{bossHp}/{maxBossHp}</span>
                            </div>
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
                                <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(bossHp/maxBossHp)*100}%` }}></div>
                            </div>
                        </div>
                     </div>
                </div>

                {/* Controls */}
                <div className="bg-slate-950 p-6 border-t border-slate-800 min-h-[300px]">
                     {/* Logs */}
                     <div className="h-16 overflow-y-auto mb-4 bg-black/30 rounded p-2 text-xs font-mono text-slate-400">
                         {logs.map((l, i) => <div key={i}>{'>'} {l}</div>)}
                     </div>

                     {turn === 'player' && currentQ ? (
                         <div>
                             <h3 className="text-white font-bold text-lg mb-4 text-center">{currentQ.q}</h3>
                             <div className="grid grid-cols-2 gap-3 mb-6">
                                 {currentQ.opts.map((opt, idx) => (
                                     <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={disabledOpts.includes(idx)}
                                        className={`p-3 rounded-xl border-2 font-bold transition-all ${disabledOpts.includes(idx) ? 'bg-slate-900 border-slate-800 text-slate-700 opacity-50' : 'bg-slate-800 border-slate-700 hover:border-purple-500 text-white'}`}
                                     >
                                         {opt}
                                     </button>
                                 ))}
                             </div>

                             {/* Allies */}
                             <div className="flex justify-center gap-4 border-t border-slate-800 pt-4">
                                 {allies.includes('wizard') && (
                                     <button 
                                        onClick={() => useAlly('wizard')} 
                                        disabled={allyCharges['wizard'] <= 0}
                                        className={`flex flex-col items-center group ${allyCharges['wizard'] <= 0 ? 'opacity-30 cursor-not-allowed' : 'text-purple-400 hover:text-white'}`}
                                     >
                                         <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-500/50 mb-1 relative">
                                             <Zap size={20}/>
                                             <span className="absolute -top-2 -right-2 bg-black text-xs rounded-full w-5 h-5 flex items-center justify-center border border-slate-700">{allyCharges['wizard']}</span>
                                         </div>
                                         <span className="text-[10px] font-bold">50/50</span>
                                     </button>
                                 )}
                                 {allies.includes('fairy') && (
                                     <button 
                                        onClick={() => useAlly('fairy')}
                                        disabled={allyCharges['fairy'] <= 0} 
                                        className={`flex flex-col items-center group ${allyCharges['fairy'] <= 0 ? 'opacity-30 cursor-not-allowed' : 'text-pink-400 hover:text-white'}`}
                                     >
                                         <div className="p-2 bg-pink-900/30 rounded-lg border border-pink-500/50 mb-1 relative">
                                             <Heart size={20}/>
                                             <span className="absolute -top-2 -right-2 bg-black text-xs rounded-full w-5 h-5 flex items-center justify-center border border-slate-700">{allyCharges['fairy']}</span>
                                         </div>
                                         <span className="text-[10px] font-bold">Heal</span>
                                     </button>
                                 )}
                                 {allies.includes('warrior') && (
                                     <button 
                                        onClick={() => useAlly('warrior')} 
                                        disabled={allyCharges['warrior'] <= 0}
                                        className={`flex flex-col items-center group ${allyCharges['warrior'] <= 0 ? 'opacity-30 cursor-not-allowed' : 'text-red-400 hover:text-white'}`}
                                     >
                                         <div className="p-2 bg-red-900/30 rounded-lg border border-red-500/50 mb-1 relative">
                                             <Sword size={20}/>
                                             <span className="absolute -top-2 -right-2 bg-black text-xs rounded-full w-5 h-5 flex items-center justify-center border border-slate-700">{allyCharges['warrior']}</span>
                                         </div>
                                         <span className="text-[10px] font-bold">x2 Dmg</span>
                                     </button>
                                 )}
                             </div>
                         </div>
                     ) : turn === 'boss' ? (
                         <div className="text-center text-red-400 py-10 animate-pulse font-bold text-xl">
                             <AlertCircle className="mx-auto mb-2" />
                             Босс атакует...
                         </div>
                     ) : turn === 'win' ? (
                         <div className="text-center py-6">
                             <Crown size={48} className="text-amber-400 mx-auto mb-4" />
                             <h2 className="text-3xl font-black text-white mb-4">ПОБЕДА!</h2>
                             <button onClick={handleVictory} className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold">Завершить</button>
                         </div>
                     ) : (
                         <div className="text-center py-6">
                             <Skull size={48} className="text-slate-500 mx-auto mb-4" />
                             <h2 className="text-3xl font-black text-white mb-4">ПОРАЖЕНИЕ</h2>
                             <button onClick={resetBattle} className="bg-slate-700 text-white px-8 py-3 rounded-xl font-bold">Попробовать снова</button>
                         </div>
                     )}
                </div>
            </div>
        </Modal>
    );
};

export default BossBattleModal;
