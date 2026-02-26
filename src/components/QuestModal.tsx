import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { Quest, Task } from '../types';
import { X, Coins, Star, Trophy, Volume2, StopCircle, Play, Clock, Zap, Loader2, Lightbulb } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { startQuestAction, selectIsPending } from '../store/userSlice';
import { completeQuestAction, markQuestCompleted, fetchQuests } from '../store/questsSlice';
import { checkAchievements } from '../store/achievementsSlice';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState, AppDispatch } from '../store';
import { useSoundEffects } from '../hooks/useSoundEffects';
import LoadingOverlay from './LoadingOverlay';

// Import task components
import QuizTask from './tasks/QuizTask';
import InputTask from './tasks/InputTask';
import TimerTask from './tasks/TimerTask';
import ChecklistTask from './tasks/ChecklistTask';
import OrderingTask from './tasks/OrderingTask';
import MatchingTask from './tasks/MatchingTask';
import YesNoTask from './tasks/YesNoTask';

interface QuestModalProps {
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
  multiplier?: number;
}

interface TaskResult {
    isCorrect: boolean;
    isPartial: boolean;
}

// Max hints per quest (4 hints = 100% penalty = 0 reward)
const MAX_HINTS = 4;
const HINT_PENALTY = 0.25; // 25% per hint

const QuestModal: React.FC<QuestModalProps> = ({ quest, isOpen, onClose, multiplier = 1 }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const isCompleting = useSelector(selectIsPending('completeQuest'));
  const { playQuestComplete } = useSoundEffects();
  
  const [taskResults, setTaskResults] = useState<{ [key: number]: TaskResult }>({});
  const [completed, setCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // === HINT SYSTEM STATE ===
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintedTasks, setHintedTasks] = useState<Set<number>>(new Set());
  
  const startTime = quest && user?.activeQuestTimers ? user.activeQuestTimers[quest.id] : null;
  const isStarted = !!startTime;
  const isAdmin = user?.role === 'admin';

  // Calculate time-based lock
  const minMs = quest ? quest.minMinutes * 60 * 1000 : 0;
  const elapsed = startTime ? Date.now() - new Date(startTime).getTime() : 0;
  const timeLeft = Math.max(0, minMs - elapsed);

  // Hint reward penalty multiplier: 1 hint = 0.75, 2 = 0.50, 3 = 0.25, 4 = 0.00
  const hintPenaltyMultiplier = Math.max(0, 1 - (hintsUsed * HINT_PENALTY));

  useEffect(() => {
    if (!isOpen) {
      setTaskResults({});
      setCompleted(false);
      setHintsUsed(0);
      setHintedTasks(new Set());
    }
  }, [isOpen]);

  // Restore cached progress
  useEffect(() => {
    if (quest && isOpen) {
      const cached = localStorage.getItem(`quest_progress_${quest.id}`);
      if (cached) {
        try { setTaskResults(JSON.parse(cached)); } catch {}
      }
      const cachedHints = localStorage.getItem(`quest_hints_${quest.id}`);
      if (cachedHints) {
        try {
          const parsed = JSON.parse(cachedHints);
          setHintsUsed(parsed.count || 0);
          setHintedTasks(new Set(parsed.taskIds || []));
        } catch {}
      }
    }
  }, [quest, isOpen]);

  const handleSpeak = () => {
    if (!quest) return;
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
      if (isCompleting || !quest) return;
      dispatch(startQuestAction(quest.id));
      toast.info("Задание началось! Таймер запущен.");
  };

  const formatTime = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTaskAnswer = useCallback((taskId: number, isCorrect: boolean, isPartial: boolean = false) => {
      setTaskResults(prev => {
          const newResults = { ...prev, [taskId]: { isCorrect, isPartial } };
          if (quest) {
              localStorage.setItem(`quest_progress_${quest.id}`, JSON.stringify(newResults));
          }
          return newResults;
      });
  }, [quest]);

  // === HINT HANDLER ===
  const handleUseHint = useCallback((taskId: number) => {
      if (hintsUsed >= MAX_HINTS) {
          toast.warning("Подсказки закончились!");
          return false;
      }
      if (hintedTasks.has(taskId)) {
          toast.info("Подсказка уже использована для этого задания.");
          return false;
      }
      
      const newCount = hintsUsed + 1;
      const newHinted = new Set(hintedTasks);
      newHinted.add(taskId);
      
      setHintsUsed(newCount);
      setHintedTasks(newHinted);
      
      // Cache hints
      if (quest) {
          localStorage.setItem(`quest_hints_${quest.id}`, JSON.stringify({
              count: newCount,
              taskIds: Array.from(newHinted)
          }));
      }
      
      const penalty = newCount * 25;
      toast.info(`💡 Подсказка! Награда снижена на ${penalty}%`, { icon: () => "💡" });
      return true;
  }, [hintsUsed, hintedTasks, quest]);

  const isTaskHinted = useCallback((taskId: number) => {
      return hintedTasks.has(taskId);
  }, [hintedTasks]);

  // === RENDER TASKS WITH HINT SUPPORT ===
  const renderTask = (task: Task) => {
      const hintProps = {
          onHint: handleUseHint,
          isHinted: isTaskHinted(task.id),
          hintsRemaining: MAX_HINTS - hintsUsed,
      };

      switch (task.type) {
        case 'quiz': return <QuizTask key={task.id} task={task} onAnswer={handleTaskAnswer} {...hintProps} />;
        case 'text_input':
        case 'number_input': return <InputTask key={task.id} task={task} onAnswer={handleTaskAnswer} {...hintProps} />;
        case 'timer_challenge': return <TimerTask key={task.id} task={task} onAnswer={handleTaskAnswer} />;
        case 'checklist': return <ChecklistTask key={task.id} task={task} onAnswer={handleTaskAnswer} />;
        case 'ordering': return <OrderingTask key={task.id} task={task} onAnswer={handleTaskAnswer} {...hintProps} />;
        case 'matching': return <MatchingTask key={task.id} task={task} onAnswer={handleTaskAnswer} {...hintProps} />;
        case 'yes_no':
        default: return <YesNoTask key={task.id} task={task} onAnswer={handleTaskAnswer} />;
      }
  };

  const handleCompleteFlow = async () => {
      if (!quest || isCompleting) return;
      if (timeLeft > 0 && !isAdmin) {
          toast.warning(`Не так быстро! Подожди ещё ${formatTime(timeLeft)}.`);
          return;
      }

      const allTasks = quest.tasks;
      const completedCount = Object.keys(taskResults).length;
      
      if (completedCount < allTasks.length && !isAdmin) {
          toast.info("Выполни все части задания!");
          return;
      }

      let totalScore = 0;
      Object.values(taskResults).forEach((res: TaskResult) => {
          if (res.isCorrect) totalScore += 1;
          else if (res.isPartial) totalScore += 0.5;
      });

      let finalMultiplier = allTasks.length > 0 ? totalScore / allTasks.length : 1;

      if (isAdmin && completedCount < allTasks.length) {
          finalMultiplier = 1.0;
      }

      if (finalMultiplier === 0 && !isAdmin) {
          toast.error("Ты провалил все задания. Попробуй снова!");
          return;
      }

      // Apply hint penalty and boost multiplier
      finalMultiplier = finalMultiplier * multiplier * hintPenaltyMultiplier;

      try {
          await dispatch(completeQuestAction({ quest, multiplier: finalMultiplier })).unwrap();
          
          // Clear cached progress & hints on success
          localStorage.removeItem(`quest_progress_${quest.id}`);
          localStorage.removeItem(`quest_hints_${quest.id}`);

          playQuestComplete(); 
          setCompleted(true);
          dispatch(markQuestCompleted(quest.id));
          dispatch(fetchQuests());
          dispatch(checkAchievements());
          
          if (hintsUsed > 0) {
              toast.info(`Использовано подсказок: ${hintsUsed} (−${hintsUsed * 25}% награды)`);
          }
          if (finalMultiplier >= 1.0) {
              toast.success(`Успех! Бонус: x${multiplier}`);
          }
      } catch (error: any) {
          console.error("Completion failed", error);
          toast.error(typeof error === 'string' ? error : (error.message || "Ошибка выполнения квеста."));
      }
  };

  if (!quest) return null;

  // Calculate displayed rewards with hint penalty
  const displayedCoins = Math.floor(quest.coins * multiplier * hintPenaltyMultiplier);
  const displayedXp = Math.floor(quest.xp * multiplier * hintPenaltyMultiplier);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={!isCompleting ? onClose : undefined}
      contentLabel={quest.title}
      role="dialog"
      ariaHideApp={false}
      shouldCloseOnOverlayClick={!isCompleting}
      shouldCloseOnEsc={!isCompleting}
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
      <LoadingOverlay isLoading={isCompleting} message="Синхронизация..." className="rounded-2xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-[#1a1625] border-2 border-slate-600/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col w-full max-h-[90vh]"
      >
        {/* Glow Border */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-purple-500/20 box-border z-20"></div>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-slate-900 p-4 md:p-6 relative border-b border-white/10 shrink-0">
             <button 
                disabled={isCompleting} 
                onClick={onClose} 
                aria-label="Закрыть квест"
                className="absolute top-4 right-4 z-30 p-2 bg-slate-800/50 rounded-full text-white/50 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-purple-500 outline-none"
             >
                 <X size={20} />
             </button>
             
             <div className="flex flex-wrap items-center gap-2 mb-2 pr-8">
                 <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{quest.category}</span>
                 <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{quest.rarity}</span>
                 {multiplier > 1 && (
                     <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center">
                         <Zap size={10} className="mr-1" /> x{multiplier} BOOST
                     </span>
                 )}
                 {isStarted && timeLeft > 0 && (
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center ${isAdmin ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                         <Clock size={10} className="mr-1" /> {formatTime(timeLeft)}
                     </span>
                 )}
             </div>
             
             <h2 className="text-xl md:text-2xl font-bold text-white rpg-font">{quest.title}</h2>
             <p className="text-slate-400 text-sm mt-1">{quest.description}</p>
             
             {/* TTS */}
             <button 
                onClick={handleSpeak}
                className="mt-2 text-slate-500 hover:text-white transition-colors"
                aria-label={isSpeaking ? "Остановить" : "Озвучить"}
             >
                {isSpeaking ? <StopCircle size={18} /> : <Volume2 size={18} />}
             </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 p-4 md:p-6">
            <AnimatePresence mode="wait">
            {completed ? (
              <motion.div key="completed" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                  <Trophy className="mx-auto mb-4 text-amber-400" size={60} />
                  <h3 className="text-2xl font-bold text-white rpg-font mb-2">Квест Выполнен!</h3>
                  <p className="text-slate-400 mb-6">Награда получена!</p>
                  
                  <div className="flex justify-center gap-4 md:gap-6 mb-4">
                      <div className="bg-slate-800/80 px-4 md:px-6 py-3 rounded-xl border border-amber-500/30 flex items-center shadow-lg">
                          <Coins className="text-amber-400 mr-2 h-5 w-5 md:h-6 md:w-6" />
                          <span className="font-bold text-lg md:text-xl text-white">+{displayedCoins}</span>
                      </div>
                      <div className="bg-slate-800/80 px-4 md:px-6 py-3 rounded-xl border border-purple-500/30 flex items-center shadow-lg">
                          <Star className="text-purple-400 mr-2 h-5 w-5 md:h-6 md:w-6" />
                          <span className="font-bold text-lg md:text-xl text-white">+{displayedXp}</span>
                      </div>
                  </div>

                  {hintsUsed > 0 && (
                      <p className="text-amber-400/70 text-sm mb-6">
                          💡 Подсказок использовано: {hintsUsed} (−{hintsUsed * 25}% награды)
                      </p>
                  )}

                  <button 
                    disabled={isCompleting} 
                    onClick={onClose} 
                    className="w-full py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-bold disabled:opacity-50 focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                      Закрыть Свиток
                  </button>
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
                            disabled={isCompleting}
                            aria-label="Начать выполнение квеста"
                            className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary-600/30 flex items-center justify-center mx-auto transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-purple-500 outline-none"
                         >
                             <Play className="mr-2 fill-current" /> Начать Выполнение
                         </button>
                     </div>
                 ) : (
                     <>
                     {/* Hint Penalty Indicator */}
                     {hintsUsed > 0 && (
                         <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
                             <div className="flex items-center gap-2 text-amber-400 text-sm">
                                 <Lightbulb size={16} />
                                 <span>Подсказок: {hintsUsed}/{MAX_HINTS}</span>
                             </div>
                             <div className="text-sm">
                                 <span className="text-slate-400">Награда: </span>
                                 <span className={`font-bold ${hintPenaltyMultiplier < 0.5 ? 'text-red-400' : hintPenaltyMultiplier < 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                     {Math.round(hintPenaltyMultiplier * 100)}%
                                 </span>
                             </div>
                         </div>
                     )}
                     <div className="space-y-6 pointer-events-auto">
                        {quest.tasks.map(task => renderTask(task))}
                     </div>
                     </>
                 )}
              </div>
            )}
            </AnimatePresence>
        </div>

        {/* Footer */}
        {!completed && isStarted && (
            <div className="p-4 md:p-6 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex gap-4 text-sm font-bold w-full md:w-auto justify-center md:justify-start">
                    <span className={`flex items-center ${hintsUsed > 0 ? 'text-amber-400/70' : 'text-amber-400'}`}>
                        <Coins className="h-4 w-4 mr-1" /> {displayedCoins}
                        {hintsUsed > 0 && <span className="text-red-400 text-xs ml-1">(-{hintsUsed * 25}%)</span>}
                    </span>
                    <span className={`flex items-center ${hintsUsed > 0 ? 'text-purple-400/70' : 'text-purple-400'}`}>
                        <Star className="h-4 w-4 mr-1" /> {displayedXp}
                    </span>
                </div>
                <button 
                   onClick={handleCompleteFlow} 
                   disabled={isCompleting || (timeLeft > 0 && !isAdmin)}
                   aria-label="Завершить квест и получить награду"
                   className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 focus:ring-2 focus:ring-purple-500 outline-none
                       ${timeLeft > 0 && !isAdmin
                           ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                           : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-600/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                       }
                   `}
                >
                    {isCompleting ? (
                        <><Loader2 className="animate-spin" size={16} /> Отправка...</>
                    ) : (
                        timeLeft > 0 && isAdmin ? <><Zap size={16} className="inline mr-2" /> Force Complete</> : timeLeft > 0 ? `Подожди: ${formatTime(timeLeft)}` : 'Завершить Квест'
                    )}
                </button>
            </div>
        )}
      </motion.div>
      </LoadingOverlay>
    </Modal>
  );
};

export default QuestModal;
