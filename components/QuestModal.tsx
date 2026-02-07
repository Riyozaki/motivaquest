import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Quest } from '../types';
import { X, CheckCircle, AlertCircle, Coins, Star, Trophy, Volume2, StopCircle, Play, Clock, Heart, Check, MinusCircle, XCircle, Zap } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { completeQuestAction, startQuestAction } from '../store/userSlice';
import { markQuestCompleted } from '../store/questsSlice';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState, AppDispatch } from '../store';

Modal.setAppElement('#root');

interface QuestModalProps {
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuestModal: React.FC<QuestModalProps> = ({ quest, isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.currentUser);
  
  // Stores "yes", "partial", "no" or null for each task
  const [taskResponses, setTaskResponses] = useState<{ [key: number]: 'yes' | 'partial' | 'no' | null }>({});
  const [completed, setCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const startTime = quest && user?.activeQuestTimers ? user.activeQuestTimers[quest.id] : null;
  const isStarted = !!startTime;
  
  // Admin Check
  const isAdmin = user?.role === 'admin' || user?.uid === 'demo_hero_id';
  
  // Calculate Time
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (isOpen && quest) {
      setTaskResponses({});
      setCompleted(false);
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen, quest]);

  // Timer Logic
  useEffect(() => {
      if (!quest || !isStarted) {
          setTimeLeft(0);
          return;
      }

      const minMs = (quest.minMinutes || 1) * 60 * 1000;
      const targetTime = startTime + minMs;

      const updateTimer = () => {
          const now = Date.now();
          const diff = targetTime - now;
          if (diff <= 0) {
              setTimeLeft(0);
          } else {
              setTimeLeft(diff);
          }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
  }, [quest, isStarted, startTime]);

  if (!quest) return null;

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const text = `${quest.title}. ${quest.description}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleStart = () => {
      dispatch(startQuestAction(quest.id));
      toast.info("Задание началось! Таймер запущен.");
  };

  const formatTime = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCompleteFlow = () => {
      // Admin Bypass
      if (timeLeft > 0 && !isAdmin) {
          toast.warning(`Не так быстро! Подожди ещё ${formatTime(timeLeft)}.`);
          return;
      }

      // Check if all tasks have a response
      const allAnswered = quest.tasks.every(task => taskResponses[task.id]);
      if (!allAnswered) {
          toast.info("Отметь выполнение всех пунктов.");
          return;
      }

      // Check if any is "no"
      const hasNo = Object.values(taskResponses).includes('no');
      if (hasNo) {
          toast.error("Выполни все задания, чтобы получить награду.");
          return;
      }

      // Check for partial
      const hasPartial = Object.values(taskResponses).includes('partial');
      const multiplier = hasPartial ? 0.5 : 1;
      
      // Auto Complete
      setCompleted(true);
      dispatch(markQuestCompleted(quest.id));
      dispatch(completeQuestAction({ quest, multiplier })); 
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="outline-none focus:outline-none"
      style={{
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px'
        },
        content: {
            position: 'relative',
            inset: 'auto',
            border: 'none',
            background: 'transparent',
            padding: 0,
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
        }
      }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-[#1a1625] border-2 border-slate-600/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col w-full max-h-[90vh]"
      >
        {/* Glow Border */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-purple-500/20 box-border z-20"></div>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-slate-900 p-4 md:p-6 relative border-b border-white/10 shrink-0">
             <button onClick={onClose} className="absolute top-4 right-4 z-30 p-2 bg-slate-800/50 rounded-full text-white/50 hover:text-white hover:bg-slate-700 transition-colors"><X size={20} /></button>
             
             <div className="flex flex-wrap items-center gap-2 mb-2 pr-8">
                 <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{quest.category}</span>
                 <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{quest.rarity}</span>
                 {isStarted && timeLeft > 0 && (
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center ${isAdmin ? 'bg-red-900/40 text-red-400 border border-red-500/30' : 'bg-amber-900/40 text-amber-400 border border-amber-500/30 animate-pulse'}`}>
                         <Clock size={10} className="mr-1"/> {isAdmin ? 'Timer Bypass' : formatTime(timeLeft)}
                     </span>
                 )}
                 {isStarted && timeLeft === 0 && !completed && !quest.completed && (
                     <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                         Готово к сдаче
                     </span>
                 )}
             </div>

             <h2 className="text-xl md:text-3xl font-bold text-white rpg-font mb-2 text-shadow-lg leading-tight">{quest.title}</h2>
             <div className="flex items-start md:items-center text-slate-400 text-sm italic">
                 <button onClick={handleSpeak} className="mr-2 mt-0.5 md:mt-0 hover:text-white transition-colors shrink-0">
                    {isSpeaking ? <StopCircle size={16} /> : <Volume2 size={16} />}
                 </button>
                 <span className="line-clamp-2 md:line-clamp-none">{quest.description}</span>
             </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-8 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex-1 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-slate-800">
            <AnimatePresence mode="wait">
            {completed || quest.completed ? (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 md:py-10">
                  <div className="inline-block p-4 md:p-6 rounded-full bg-amber-500/20 text-amber-500 mb-6 border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                      <Trophy size={48} className="md:w-16 md:h-16" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white rpg-font mb-2">Победа!</h3>
                  <p className="text-slate-400 mb-8">Ты стал мудрее. Награда получена!</p>
                  
                  <div className="flex justify-center gap-4 md:gap-6 mb-8">
                      <div className="bg-slate-800/80 px-4 md:px-6 py-3 rounded-xl border border-amber-500/30 flex items-center shadow-lg">
                          <Coins className="text-amber-400 mr-2 h-5 w-5 md:h-6 md:w-6" />
                          <span className="font-bold text-lg md:text-xl text-white">+{quest.coins}</span>
                      </div>
                      <div className="bg-slate-800/80 px-4 md:px-6 py-3 rounded-xl border border-purple-500/30 flex items-center shadow-lg">
                          <Star className="text-purple-400 mr-2 h-5 w-5 md:h-6 md:w-6" />
                          <span className="font-bold text-lg md:text-xl text-white">+{quest.xp}</span>
                      </div>
                  </div>
                  <button onClick={onClose} className="w-full py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-bold">Закрыть Свиток</button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                 {!isStarted ? (
                     <div className="text-center py-10">
                         <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-slate-700">
                             <Clock size={40} className="text-slate-500" />
                         </div>
                         <p className="text-slate-400 mb-6">Время выполнения: <span className="text-white font-bold">{quest.minMinutes} мин</span></p>
                         <button 
                            onClick={handleStart}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary-600/30 flex items-center justify-center mx-auto transition-transform active:scale-95"
                         >
                             <Play className="mr-2 fill-current" /> Начать Выполнение
                         </button>
                     </div>
                 ) : (
                     <div className="space-y-4">
                        {quest.tasks.map((task, idx) => (
                            <motion.div 
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                key={task.id} 
                                className="bg-slate-800/60 p-4 md:p-5 rounded-xl border border-slate-700/50"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Руна {idx + 1}</span>
                                    {taskResponses[task.id] === 'yes' && <CheckCircle className="text-emerald-500 h-5 w-5" />}
                                    {taskResponses[task.id] === 'partial' && <MinusCircle className="text-amber-500 h-5 w-5" />}
                                    {taskResponses[task.id] === 'no' && <XCircle className="text-red-500 h-5 w-5" />}
                                </div>
                                <p className="font-medium text-slate-200 mb-4 text-base md:text-lg">{task.question}</p>
                                
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setTaskResponses(prev => ({...prev, [task.id]: 'yes'}))}
                                        className={`py-3 rounded-lg font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 border-2
                                            ${taskResponses[task.id] === 'yes' 
                                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-300'
                                            }
                                        `}
                                    >
                                        <Check size={18} />
                                        Да
                                    </button>
                                    <button
                                        onClick={() => setTaskResponses(prev => ({...prev, [task.id]: 'partial'}))}
                                        className={`py-3 rounded-lg font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 border-2
                                            ${taskResponses[task.id] === 'partial' 
                                                ? 'bg-amber-600/20 border-amber-500 text-amber-400' 
                                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-amber-500/50 hover:text-amber-300'
                                            }
                                        `}
                                    >
                                        <MinusCircle size={18} />
                                        Частично
                                    </button>
                                    <button
                                        onClick={() => setTaskResponses(prev => ({...prev, [task.id]: 'no'}))}
                                        className={`py-3 rounded-lg font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 border-2
                                            ${taskResponses[task.id] === 'no' 
                                                ? 'bg-red-600/20 border-red-500 text-red-400' 
                                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-300'
                                            }
                                        `}
                                    >
                                        <X size={18} />
                                        Нет
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                     </div>
                 )}
              </div>
            )}
            </AnimatePresence>
        </div>

        {/* Footer */}
        {!(completed || quest.completed) && isStarted && (
            <div className="p-4 md:p-6 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex gap-4 text-sm font-bold w-full md:w-auto justify-center md:justify-start">
                    <span className="flex items-center text-amber-400"><Coins className="h-4 w-4 mr-1" /> {quest.coins}</span>
                    <span className="flex items-center text-purple-400"><Star className="h-4 w-4 mr-1" /> {quest.xp}</span>
                </div>
                <button 
                   onClick={handleCompleteFlow} 
                   className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg
                       ${timeLeft > 0 && !isAdmin
                           ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                           : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-600/30 hover:scale-105 active:scale-95'
                       }
                   `}
                >
                    {timeLeft > 0 && isAdmin ? <><Zap size={16} className="inline mr-2" /> Force Complete</> : timeLeft > 0 ? `Подожди: ${formatTime(timeLeft)}` : 'Отметить как готовое'}
                </button>
            </div>
        )}
      </motion.div>
    </Modal>
  );
};

export default QuestModal;