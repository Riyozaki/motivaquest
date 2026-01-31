import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sword, Shield, Zap, Skull, Crown, Sparkles, BookOpen, Dumbbell, Calculator, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { finishCampaign } from '../store/userSlice';
import confetti from 'canvas-confetti';

Modal.setAppElement('#root');

interface BossBattleModalProps {
    isOpen: boolean;
    onClose: () => void;
    allies: string[]; // ['wizard', 'fairy', 'warrior']
}

interface BattleLog {
    id: number;
    text: string;
    type: 'player' | 'boss' | 'info' | 'heal';
}

interface FloatingText {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
}

const BossBattleModal: React.FC<BossBattleModalProps> = ({ isOpen, onClose, allies }) => {
    const dispatch = useDispatch<AppDispatch>();
    
    // Stats
    const maxPlayerHp = 120;
    const maxBossHp = 400; // Increased boss HP to balance new skills
    
    const [playerHp, setPlayerHp] = useState(maxPlayerHp);
    const [bossHp, setBossHp] = useState(maxBossHp);
    const [turn, setTurn] = useState<'player' | 'boss' | 'win' | 'lose'>('player');
    const [logs, setLogs] = useState<BattleLog[]>([]);
    
    // Visual Effects State
    const [shake, setShake] = useState(0);
    const [bossFlash, setBossFlash] = useState(false);
    const [playerFlash, setPlayerFlash] = useState(false);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [bossActionAnim, setBossActionAnim] = useState<string>('');

    // Cooldowns
    const [cooldowns, setCooldowns] = useState<{ [key: string]: number }>({
        wizard: 0,
        warrior: 0,
        fairy: 0,
        sport: 0
    });

    // Refs for safe timeouts
    const turnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isOpen) {
            resetBattle();
            addLog("Король Лени: 'Ты посмел нарушить мой покой?'", 'info');
        }
        return () => {
            if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
        };
    }, [isOpen]);

    // Boss Turn Logic
    useEffect(() => {
        if (turn === 'boss') {
            turnTimeoutRef.current = setTimeout(() => {
                bossAttack();
            }, 1500);
        }
    }, [turn]);

    const resetBattle = () => {
        setPlayerHp(maxPlayerHp);
        setBossHp(maxBossHp);
        setTurn('player');
        setLogs([]);
        setFloatingTexts([]);
        setCooldowns({ wizard: 0, warrior: 0, fairy: 0, sport: 0 });
        setBossFlash(false);
        setPlayerFlash(false);
        setBossActionAnim('');
    };

    const addLog = (text: string, type: BattleLog['type']) => {
        setLogs(prev => [{ id: Date.now(), text, type }, ...prev].slice(0, 5));
    };

    const spawnFloatingText = (text: string, target: 'player' | 'boss', type: 'damage' | 'heal' | 'miss') => {
        const id = Date.now() + Math.random();
        // Randomize position slightly
        const offsetX = Math.random() * 40 - 20; 
        const offsetY = Math.random() * 20 - 10;
        
        let x = target === 'boss' ? 50 + offsetX : 20 + offsetX; // % positions
        let y = target === 'boss' ? 30 + offsetY : 60 + offsetY;
        
        let color = 'text-white';
        if (type === 'damage') color = target === 'player' ? 'text-red-500' : 'text-yellow-400';
        if (type === 'heal') color = 'text-emerald-400';
        
        setFloatingTexts(prev => [...prev, { id, text, x, y, color }]);

        // Remove after animation
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
        }, 1000);
    };

    const triggerShake = () => {
        setShake(prev => prev + 1);
        setTimeout(() => setShake(0), 500);
    };

    const handleDamage = (target: 'player' | 'boss', amount: number) => {
        if (target === 'boss') {
            setBossHp(prev => Math.max(0, prev - amount));
            setBossFlash(true);
            setTimeout(() => setBossFlash(false), 200);
            spawnFloatingText(`-${amount}`, 'boss', 'damage');
            triggerShake();
        } else {
            setPlayerHp(prev => Math.max(0, prev - amount));
            setPlayerFlash(true);
            setTimeout(() => setPlayerFlash(false), 200);
            spawnFloatingText(`-${amount}`, 'player', 'damage');
            triggerShake();
        }
    };

    const handleHeal = (amount: number) => {
        setPlayerHp(prev => Math.min(maxPlayerHp, prev + amount));
        spawnFloatingText(`+${amount}`, 'player', 'heal');
    };

    const checkWinCondition = (currentBossHp: number) => {
        if (currentBossHp <= 0) {
            setBossHp(0);
            setTurn('win');
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
            return true;
        }
        return false;
    };

    const playerAction = (action: string) => {
        if (turn !== 'player') return;

        let damage = 0;
        let heal = 0;
        let logMsg = "";
        let logType: BattleLog['type'] = 'player';
        let newCooldowns = { ...cooldowns };

        // Reduce cooldowns
        Object.keys(newCooldowns).forEach(k => {
            if (newCooldowns[k] > 0) newCooldowns[k]--;
        });

        // --- SKILLS ---
        switch (action) {
            case 'math_strike': // High Variance Dmg
                const isCrit = Math.random() > 0.6;
                damage = isCrit ? 45 : 15;
                logMsg = isCrit 
                    ? `КРИТ! Точный расчет уязвимости! (-${damage})` 
                    : `Вычисление удара... Попадание. (-${damage})`;
                break;
            
            case 'sport_bash': // Dmg + Heal
                if (newCooldowns.sport > 0) return;
                damage = 15;
                heal = 10;
                newCooldowns.sport = 2;
                logMsg = `Удар выносливости! (-${damage}, +${heal} HP)`;
                break;

            case 'lang_word': // Consistent Dmg
                damage = 25;
                logMsg = "Сила Слова бьет без промаха! (-25)";
                break;

            // --- ALLIES (MAGIC) ---
            case 'warrior':
                if (newCooldowns.warrior > 0) return;
                damage = 60;
                logMsg = "⚔️ Воин Дисциплины ломает защиту босса! (-60)";
                newCooldowns.warrior = 4;
                break;
            case 'wizard':
                if (newCooldowns.wizard > 0) return;
                damage = 50;
                logMsg = "🔥 Волшебник сжигает лень Огнем Дедлайна! (-50)";
                newCooldowns.wizard = 3; // Reduced cooldown for more fun
                break;
            case 'fairy':
                if (newCooldowns.fairy > 0) return;
                heal = 60;
                logMsg = "🧚‍♀️ Дух Мотивации дарует второе дыхание! (+60 HP)";
                logType = 'heal';
                newCooldowns.fairy = 4;
                break;
        }

        setCooldowns(newCooldowns);

        // Apply Effects
        if (damage > 0) {
            handleDamage('boss', damage);
            // Check win IMMEDIATELY before setting turn to boss
            if (bossHp - damage <= 0) {
                checkWinCondition(bossHp - damage);
                return;
            }
        }

        if (heal > 0) {
            handleHeal(heal);
        }

        addLog(logMsg, logType);
        setTurn('boss');
    };

    const bossAttack = () => {
        if (bossHp <= 0) return; // Safety check

        const moves = [
            { name: "Скука", dmg: 10, msg: "Босс зевает. Вы теряете бдительность." },
            { name: "Прокрастинация", dmg: 15, msg: "Босс откладывает вашу защиту на потом." },
            { name: "Сомнение", dmg: 25, msg: "Босс шепчет: 'У тебя ничего не выйдет'." },
            { name: "Тяжесть Бытия", dmg: 35, msg: "Тяжелая атака ленью!" },
        ];

        // Boss gets stronger as HP gets lower
        let moveIndex = Math.floor(Math.random() * 3); // Light attacks
        if (bossHp < maxBossHp * 0.5) {
             moveIndex = Math.floor(Math.random() * moves.length); // All attacks including heavy
        }

        const move = moves[moveIndex];
        
        // Critical hit chance for boss
        let finalDmg = move.dmg;
        let isCrit = false;
        if (Math.random() > 0.8) {
            finalDmg = Math.floor(finalDmg * 1.5);
            isCrit = true;
        }

        setBossActionAnim('attack');
        setTimeout(() => setBossActionAnim(''), 500);

        handleDamage('player', finalDmg);
        addLog(`${move.msg} ${isCrit ? '(КРИТ!)' : ''}`, 'boss');

        if (playerHp - finalDmg <= 0) {
            setTurn('lose');
        } else {
            setTurn('player');
        }
    };

    const handleVictory = () => {
        dispatch(finishCampaign());
        onClose();
    };

    // Smooth HP Bar Component
    const HpBar = ({ current, max, color, label }: { current: number, max: number, color: string, label: string }) => {
        const percent = Math.max(0, Math.min(100, (current / max) * 100));
        return (
            <div className="w-full">
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1 px-1">
                    <span>{label}</span>
                    <span>{current}/{max}</span>
                </div>
                <div className="h-4 bg-slate-950 rounded-full border border-slate-700 overflow-hidden relative shadow-inner">
                    <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: `${percent}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 15 }}
                        className={`h-full ${color} relative`}
                    >
                        {/* Shine effect */}
                        <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30 blur-[2px]"></div>
                    </motion.div>
                </div>
            </div>
        );
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
            <motion.div 
                animate={{ x: shake % 2 === 0 ? -5 : 5 }}
                transition={{ duration: 0.1 }}
                className="relative w-full bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
                {/* Floating Text Container (Absolute overlay) */}
                <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                    <AnimatePresence>
                        {floatingTexts.map(ft => (
                            <motion.div
                                key={ft.id}
                                initial={{ opacity: 1, y: `${ft.y}%`, x: `${ft.x}%`, scale: 0.5 }}
                                animate={{ opacity: 0, y: `${ft.y - 15}%`, scale: 1.5 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                className={`absolute font-black text-4xl ${ft.color} text-shadow-lg`}
                                style={{ left: 0, top: 0 }} // Positioning handled by initial/animate
                            >
                                {ft.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* --- BATTLE SCENE --- */}
                <div className={`relative h-72 transition-colors duration-200 ${playerFlash ? 'bg-red-900/50' : 'bg-slate-900'}`}>
                    {/* Background Image/Gradient */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black opacity-80"></div>
                    
                    {/* BOSS */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center w-64 z-10">
                        <HpBar current={bossHp} max={maxBossHp} color="bg-gradient-to-r from-red-600 to-red-500" label="Король Лени" />
                        <motion.div 
                            animate={
                                bossActionAnim === 'attack' ? { scale: 1.2, y: 30 } : 
                                bossFlash ? { x: [-5, 5, -5, 5, 0], filter: "brightness(2)" } : 
                                { y: [0, -5, 0] }
                            }
                            transition={{ y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
                            className="mt-6 relative"
                        >
                             <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)] relative z-10 transition-colors duration-200 ${bossFlash ? 'bg-red-500 border-white' : 'bg-slate-800 border-red-900'}`}>
                                 <Skull size={64} className={`${bossFlash ? 'text-white' : 'text-red-500'}`} />
                             </div>
                             {/* Aura */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-red-600/10 blur-2xl rounded-full -z-10 animate-pulse"></div>
                        </motion.div>
                    </div>

                    {/* PLAYER STATS */}
                    <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-slate-900 to-transparent z-20">
                        <div className="flex items-end justify-between max-w-lg mx-auto">
                            <div className="w-full">
                                <HpBar current={playerHp} max={maxPlayerHp} color="bg-gradient-to-r from-emerald-500 to-emerald-400" label="Вы (Герой)" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CONTROL PANEL --- */}
                <div className="bg-slate-950 border-t border-slate-800 p-4 min-h-[250px] flex flex-col">
                    
                    {/* Battle Log */}
                    <div className="h-20 overflow-y-auto mb-4 bg-black/30 rounded-lg p-2 border border-slate-800 text-xs md:text-sm font-mono flex flex-col-reverse shadow-inner">
                        {logs.map(log => (
                            <motion.div 
                                key={log.id} 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }}
                                className={`mb-1 truncate ${
                                    log.type === 'player' ? 'text-emerald-300' : 
                                    log.type === 'boss' ? 'text-red-300' : 
                                    log.type === 'heal' ? 'text-green-400 font-bold' :
                                    'text-slate-400'
                                }`}
                            >
                                {log.type === 'boss' ? '💀' : log.type === 'heal' ? '💚' : '>'} {log.text}
                            </motion.div>
                        ))}
                    </div>

                    {/* ACTIONS GRID */}
                    {turn === 'player' && (
                        <div className="flex-1 grid grid-cols-4 gap-2 md:gap-3">
                            {/* Standard Skills */}
                            <button onClick={() => playerAction('math_strike')} className="col-span-1 bg-slate-800 hover:bg-indigo-900/50 border border-slate-700 hover:border-indigo-500 text-indigo-300 rounded-xl flex flex-col items-center justify-center p-2 transition-all active:scale-95 group">
                                <Calculator size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase">Расчет</span>
                            </button>
                            
                            <button onClick={() => playerAction('lang_word')} className="col-span-1 bg-slate-800 hover:bg-blue-900/50 border border-slate-700 hover:border-blue-500 text-blue-300 rounded-xl flex flex-col items-center justify-center p-2 transition-all active:scale-95 group">
                                <BookOpen size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase">Слово</span>
                            </button>

                            <button onClick={() => playerAction('sport_bash')} disabled={cooldowns.sport > 0} className={`col-span-1 border rounded-xl flex flex-col items-center justify-center p-2 transition-all active:scale-95 group ${cooldowns.sport > 0 ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-50' : 'bg-slate-800 hover:bg-emerald-900/50 border-slate-700 hover:border-emerald-500 text-emerald-300'}`}>
                                <Dumbbell size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase">{cooldowns.sport > 0 ? `${cooldowns.sport}х` : 'Спорт'}</span>
                            </button>

                            {/* Filler or Item (Disabled for now) */}
                            <div className="col-span-1 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-center text-slate-700">
                                <span className="text-xs">...</span>
                            </div>

                            {/* ALLY MAGIC ROW */}
                            <div className="col-span-4 mt-2 grid grid-cols-3 gap-2 border-t border-slate-800 pt-3">
                                <button 
                                    onClick={() => playerAction('wizard')} 
                                    disabled={!allies.includes('wizard') || cooldowns.wizard > 0}
                                    className={`relative py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                                        allies.includes('wizard') && cooldowns.wizard === 0
                                        ? 'bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                                        : 'bg-slate-900 text-slate-600 border-slate-800 opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    <Zap size={18} className={allies.includes('wizard') && cooldowns.wizard === 0 ? 'animate-pulse' : ''} />
                                    <span className="text-[10px] uppercase">Магия</span>
                                    {cooldowns.wizard > 0 && <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center font-black text-xl text-white rounded-xl">{cooldowns.wizard}</div>}
                                </button>

                                <button 
                                    onClick={() => playerAction('warrior')} 
                                    disabled={!allies.includes('warrior') || cooldowns.warrior > 0}
                                    className={`relative py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                                        allies.includes('warrior') && cooldowns.warrior === 0
                                        ? 'bg-red-900/40 hover:bg-red-800/60 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                                        : 'bg-slate-900 text-slate-600 border-slate-800 opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    <Sword size={18} />
                                    <span className="text-[10px] uppercase">Удар</span>
                                    {cooldowns.warrior > 0 && <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center font-black text-xl text-white rounded-xl">{cooldowns.warrior}</div>}
                                </button>

                                <button 
                                    onClick={() => playerAction('fairy')} 
                                    disabled={!allies.includes('fairy') || cooldowns.fairy > 0}
                                    className={`relative py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                                        allies.includes('fairy') && cooldowns.fairy === 0
                                        ? 'bg-pink-900/40 hover:bg-pink-800/60 text-pink-300 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.2)]' 
                                        : 'bg-slate-900 text-slate-600 border-slate-800 opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    <Heart size={18} />
                                    <span className="text-[10px] uppercase">Хил</span>
                                    {cooldowns.fairy > 0 && <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center font-black text-xl text-white rounded-xl">{cooldowns.fairy}</div>}
                                </button>
                            </div>
                        </div>
                    )}

                    {turn === 'boss' && (
                        <div className="flex-1 flex items-center justify-center flex-col text-red-400">
                            <AlertCircle size={32} className="mb-2 animate-bounce" />
                            <span className="font-bold text-lg animate-pulse">Босс готовит атаку...</span>
                        </div>
                    )}

                    {/* --- END GAME SCREENS --- */}
                    {turn === 'win' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-50">
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} 
                                className="bg-amber-500/20 p-6 rounded-full border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.5)] mb-6"
                            >
                                <Crown size={64} className="text-amber-400" />
                            </motion.div>
                            <h2 className="text-4xl font-black text-white mb-4 rpg-font">ПОБЕДА!</h2>
                            <p className="text-slate-400 mb-8 px-8 text-center max-w-md">Тень рассеялась. Твои знания стали твоим мечом. Мир спасен!</p>
                            <button onClick={handleVictory} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-10 py-4 rounded-xl font-bold text-xl shadow-lg transform hover:scale-105 transition-all">
                                Завершить Путь Героя
                            </button>
                        </motion.div>
                    )}

                    {turn === 'lose' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50">
                            <Skull size={64} className="text-slate-600 mb-4" />
                            <h2 className="text-3xl font-black text-white mb-2 rpg-font">ПОРАЖЕНИЕ</h2>
                            <p className="text-slate-500 mb-8 px-8 text-center">Не сдавайся. Передохни и попробуй снова.</p>
                            <button onClick={resetBattle} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold text-lg border border-slate-600">
                                Реванш
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </Modal>
    );
};

export default BossBattleModal;