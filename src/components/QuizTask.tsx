import React, { useState } from 'react';
import { Task } from '../../types';
import { motion } from 'framer-motion';
import { Check, X, Lightbulb } from 'lucide-react';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean) => void;
    // Hint props (optional for backward compat)
    onHint?: (taskId: number) => boolean;
    isHinted?: boolean;
    hintsRemaining?: number;
}

const QuizTask: React.FC<Props> = ({ task, onAnswer, onHint, isHinted = false, hintsRemaining = 0 }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [eliminatedIndex, setEliminatedIndex] = useState<number | null>(null);
    const { playCorrect, playWrong } = useSoundEffects();

    const handleSelect = (idx: number) => {
        if (isSubmitted || idx === eliminatedIndex) return;
        setSelected(idx);
        setIsSubmitted(true);
        const correct = idx === task.correctIndex;
        if (correct) playCorrect();
        else playWrong();
        onAnswer(task.id, correct);
    };

    // === HINT: Eliminate one wrong answer ===
    const handleHint = () => {
        if (isSubmitted || !onHint || eliminatedIndex !== null) return;
        
        const success = onHint(task.id);
        if (!success) return;
        
        // Find a wrong answer to eliminate (random wrong answer, not the correct one)
        const wrongIndices = (task.options || [])
            .map((_, idx) => idx)
            .filter(idx => idx !== task.correctIndex);
        
        if (wrongIndices.length > 0) {
            const randomWrong = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
            setEliminatedIndex(randomWrong);
        }
    };

    const canUseHint = !isSubmitted && !isHinted && eliminatedIndex === null && (hintsRemaining ?? 0) > 0 && onHint;

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-start justify-between gap-2 mb-4">
                <h4 className="font-bold text-white text-lg">{task.question}</h4>
                
                {/* Hint Button */}
                {canUseHint && (
                    <button
                        onClick={handleHint}
                        className="shrink-0 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all group"
                        title="Подсказка: убрать один неверный ответ (−25% награды)"
                    >
                        <Lightbulb size={18} className="group-hover:drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="group" aria-label="Варианты ответов">
                {task.options?.map((opt, idx) => {
                    const isEliminated = idx === eliminatedIndex;
                    
                    let btnClass = "bg-slate-700 hover:bg-slate-600 border-slate-600";
                    
                    // Eliminated by hint — yellow strikethrough
                    if (isEliminated && !isSubmitted) {
                        btnClass = "bg-amber-900/30 border-amber-500/40 text-amber-400/50 line-through cursor-not-allowed";
                    }
                    
                    if (isSubmitted) {
                        if (idx === task.correctIndex) btnClass = "bg-emerald-600 border-emerald-500 text-white ring-2 ring-emerald-400";
                        else if (idx === selected) btnClass = "bg-red-600 border-red-500 text-white opacity-50";
                        else if (isEliminated) btnClass = "bg-amber-900/20 border-amber-500/20 text-amber-400/30 line-through opacity-30";
                        else btnClass = "bg-slate-800 border-slate-700 opacity-50";
                    }

                    const isPressed = selected === idx;

                    return (
                        <motion.button
                            key={idx}
                            whileTap={!isSubmitted && !isEliminated ? { scale: 0.98 } : {}}
                            onClick={() => handleSelect(idx)}
                            aria-pressed={isPressed}
                            disabled={isSubmitted || isEliminated}
                            className={`p-3 rounded-lg border text-left text-sm font-medium transition-all relative ${btnClass} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        >
                            {opt}
                            {isSubmitted && idx === task.correctIndex && <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Верный ответ" />}
                            {isSubmitted && idx === selected && idx !== task.correctIndex && <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Неверный ответ" />}
                            {isEliminated && !isSubmitted && <X size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/50" />}
                        </motion.button>
                    );
                })}
            </div>

            {/* Hint used indicator */}
            {eliminatedIndex !== null && !isSubmitted && (
                <div className="mt-2 text-xs text-amber-400/60 flex items-center gap-1">
                    <Lightbulb size={12} /> Один неверный ответ убран
                </div>
            )}

            {isSubmitted && task.explanation && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="mt-4 p-3 bg-blue-900/20 border-l-4 border-blue-500 rounded text-blue-200 text-sm"
                    aria-live="polite"
                >
                    <strong>Пояснение:</strong> {task.explanation}
                </motion.div>
            )}
        </div>
    );
};

export default QuizTask;
