import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Quest, QuestRarity } from '../types';
import { X, CheckCircle, AlertCircle, Coins, Star, Trophy, Volume2, StopCircle, Clock } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addExperience, completeQuestAction } from '../store/userSlice';
import { markQuestCompleted } from '../store/questsSlice';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

Modal.setAppElement('#root');

interface QuestModalProps {
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuestModal: React.FC<QuestModalProps> = ({ quest, isOpen, onClose }) => {
  const dispatch = useDispatch();
  
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [feedback, setFeedback] = useState<{ [key: number]: boolean | null }>({});
  const [completed, setCompleted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isOpen && quest) {
      setAnswers({});
      setFeedback({});
      setCompleted(false);
      setTimeSpent(0);
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen, quest]);

  useEffect(() => {
    let interval: any;
    if (isOpen && !completed) {
      interval = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, completed]);

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

  const checkAnswers = () => {
    const requiredTime = quest.cooldownSeconds || 5;
    if (timeSpent < requiredTime) {
        toast.warning(`Заклинание еще не готово. Подожди ${requiredTime - timeSpent} сек.`);
        return;
    }

    let allCorrect = true;
    const newFeedback: { [key: number]: boolean } = {};
    let hasEmpty = false;

    quest.tasks.forEach(task => {
      const userAnswer = (answers[task.id] || "").trim().toLowerCase();
      if (!userAnswer) hasEmpty = true;
      const isCorrect = task.correctAnswer === '*' || userAnswer === task.correctAnswer.toLowerCase();
      newFeedback[task.id] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    if (hasEmpty) {
        toast.info("Заполни все руны.");
        return;
    }

    setFeedback(newFeedback);

    if (allCorrect) {
      setCompleted(true);
      setTimeout(() => {
        dispatch(addExperience({ xp: quest.xp, coins: quest.coins }) as any);
        dispatch(markQuestCompleted(quest.id) as any);
        dispatch(completeQuestAction(quest.id) as any);
      }, 500);
    } else {
        toast.error("Ритуал сорван. Исправь ошибки.");
    }
  };

  const progressVal = Math.min(100, (timeSpent / (quest.cooldownSeconds || 5)) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="outline-none"
      style={{
        content: {
            top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)',
            border: 'none', background: 'transparent', maxWidth: '650px', width: '95%', padding: 0
        }
      }}
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative bg-[#1a1625] border-2 border-slate-600/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Magical Glow Border */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-purple-500/20 box-border"></div>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-6 relative border-b border-white/10">
             <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"><X /></button>
             
             <div className="flex items-center gap-2 mb-2">
                 <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{quest.category}</span>
                 <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{quest.difficulty}</span>
             </div>

             <h2 className="text-3xl font-bold text-white rpg-font mb-2 text-shadow-lg">{quest.title}</h2>
             <div className="flex items-center text-slate-400 text-sm italic">
                 <button onClick={handleSpeak} className="mr-2 hover:text-white transition-colors">
                    {isSpeaking ? <StopCircle size={16} /> : <Volume2 size={16} />}
                 </button>
                 {quest.description}
             </div>
             
             {/* Cooldown Bar */}
             {!completed && !quest.completed && (
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                    <motion.div 
                        animate={{ width: `${progressVal}%` }} 
                        className="h-full bg-gradient-to-r from-purple-500 to-amber-500 shadow-[0_0_10px_#a855f7]"
                    ></motion.div>
                 </div>
             )}
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex-1">
            <AnimatePresence mode="wait">
            {completed || quest.completed ? (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                  <div className="inline-block p-6 rounded-full bg-amber-500/20 text-amber-500 mb-6 border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                      <Trophy size={64} />
                  </div>
                  <h3 className="text-3xl font-bold text-white rpg-font mb-2">Победа!</h3>
                  <p className="text-slate-400 mb-8">Ты стал мудрее. Награда твоя.</p>
                  
                  <div className="flex justify-center gap-6 mb-8">
                      <div className="bg-slate-800/80 px-6 py-3 rounded-xl border border-amber-500/30 flex items-center shadow-lg">
                          <Coins className="text-amber-400 mr-2 h-6 w-6" />
                          <span className="font-bold text-xl text-white">+{quest.coins}</span>
                      </div>
                      <div className="bg-slate-800/80 px-6 py-3 rounded-xl border border-purple-500/30 flex items-center shadow-lg">
                          <Star className="text-purple-400 mr-2 h-6 w-6" />
                          <span className="font-bold text-xl text-white">+{quest.xp}</span>
                      </div>
                  </div>
                  <button onClick={onClose} className="w-full py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-bold">Закрыть Свиток</button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                 {quest.tasks.map((task, idx) => (
                     <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        key={task.id} 
                        className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50"
                     >
                         <div className="flex justify-between items-center mb-3">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Руна {idx + 1}</span>
                             {feedback[task.id] === true && <CheckCircle className="text-emerald-500 h-5 w-5" />}
                             {feedback[task.id] === false && <AlertCircle className="text-red-500 h-5 w-5" />}
                         </div>
                         <p className="font-medium text-slate-200 mb-4 text-lg">{task.question}</p>
                         <input 
                            type="text" 
                            className={`w-full p-3 bg-slate-900 border rounded-lg text-white outline-none transition-all placeholder:text-slate-600
                                ${feedback[task.id] === false ? 'border-red-500' : 'border-slate-700 focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]'}
                            `}
                            placeholder="Напиши ответ..."
                            value={answers[task.id] || ''}
                            onChange={(e) => setAnswers(prev => ({...prev, [task.id]: e.target.value}))}
                            disabled={feedback[task.id] === true}
                         />
                     </motion.div>
                 ))}
              </div>
            )}
            </AnimatePresence>
        </div>

        {/* Footer */}
        {!(completed || quest.completed) && (
            <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                <div className="flex gap-4 text-sm font-bold">
                    <span className="flex items-center text-amber-400"><Coins className="h-4 w-4 mr-1" /> {quest.coins}</span>
                    <span className="flex items-center text-purple-400"><Star className="h-4 w-4 mr-1" /> {quest.xp}</span>
                </div>
                <button 
                   onClick={checkAnswers} 
                   className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg
                       ${progressVal < 100 
                           ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                           : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-purple-600/30 hover:scale-105 active:scale-95'
                       }
                   `}
                >
                    {progressVal < 100 ? 'Подготовка...' : 'Завершить'}
                </button>
            </div>
        )}
      </motion.div>
    </Modal>
  );
};

export default QuestModal;