import React, { useState } from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateUserProfile } from '../store/userSlice';
import { GraduationCap, BookOpen, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const ClassSelectionModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  // Show if user exists but has no grade assigned
  const isOpen = !!user && !user.grade;

  const handleSave = () => {
    if (selectedGrade) {
      dispatch(updateUserProfile({ grade: selectedGrade }));
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      className="outline-none focus:outline-none"
      style={{
        overlay: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        content: {
            position: 'relative',
            inset: 'auto',
            border: 'none',
            background: 'transparent',
            padding: 0,
            maxWidth: '500px',
            width: '90%',
        }
      }}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel p-8 rounded-3xl text-center relative overflow-hidden rpg-border"
      >
        <div className="corner-accent corner-tl"></div>
        <div className="corner-accent corner-tr"></div>
        <div className="corner-accent corner-bl"></div>
        <div className="corner-accent corner-br"></div>

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500"></div>
        
        <div className="mb-6 flex justify-center">
            <div className="p-4 bg-primary-900/30 rounded-full border border-primary-500/30 shadow-[0_0_30px_rgba(var(--color-primary-600),0.3)]">
                <GraduationCap size={48} className="text-primary-300" />
            </div>
        </div>

        <h2 className="text-2xl font-bold text-white rpg-font mb-2">Выбор Пути</h2>
        <p className="text-slate-400 mb-8 text-sm">
          Чтобы Гильдия выдала тебе подходящие квесты, укажи, в каком классе ты обучаешься.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
            {[5, 6, 7, 8, 9, 10, 11].map((grade) => (
                <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={`py-3 rounded-xl font-bold transition-all border-2 relative overflow-hidden group
                        ${selectedGrade === grade 
                            ? 'bg-primary-600 border-primary-400 text-white shadow-[0_0_20px_rgba(var(--color-primary-600),0.5)]' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-primary-500/50 hover:text-white'
                        }
                    `}
                >
                    <span className="relative z-10">{grade} Класс</span>
                    {selectedGrade === grade && (
                        <motion.div layoutId="check" className="absolute top-1 right-1 text-white bg-green-500 rounded-full p-0.5">
                            <Check size={10} />
                        </motion.div>
                    )}
                </button>
            ))}
        </div>

        <button
            onClick={handleSave}
            disabled={!selectedGrade}
            className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2
                ${selectedGrade 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/30 transform hover:-translate-y-1' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }
            `}
        >
            <BookOpen size={20} />
            <span>Принять Судьбу</span>
        </button>

      </motion.div>
    </Modal>
  );
};

export default ClassSelectionModal;