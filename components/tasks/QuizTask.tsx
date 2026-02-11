
import React, { useState } from 'react';
import { Task } from '../../types';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean) => void;
}

const QuizTask: React.FC<Props> = ({ task, onAnswer }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { playCorrect, playWrong } = useSoundEffects();

    const handleSelect = (idx: number) => {
        if (isSubmitted) return;
        setSelected(idx);
        setIsSubmitted(true);
        const correct = idx === task.correctIndex;
        if (correct) playCorrect();
        else playWrong();
        onAnswer(task.id, correct);
    };

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-4 text-lg">{task.question}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {task.options?.map((opt, idx) => {
                    let btnClass = "bg-slate-700 hover:bg-slate-600 border-slate-600";
                    if (isSubmitted) {
                        if (idx === task.correctIndex) btnClass = "bg-emerald-600 border-emerald-500 text-white ring-2 ring-emerald-400";
                        else if (idx === selected) btnClass = "bg-red-600 border-red-500 text-white opacity-50";
                        else btnClass = "bg-slate-800 border-slate-700 opacity-50";
                    }

                    return (
                        <motion.button
                            key={idx}
                            whileTap={!isSubmitted ? { scale: 0.98 } : {}}
                            onClick={() => handleSelect(idx)}
                            className={`p-3 rounded-lg border text-left text-sm font-medium transition-all relative ${btnClass}`}
                            disabled={isSubmitted}
                        >
                            {opt}
                            {isSubmitted && idx === task.correctIndex && <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2" />}
                            {isSubmitted && idx === selected && idx !== task.correctIndex && <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2" />}
                        </motion.button>
                    )
                })}
            </div>
            {isSubmitted && task.explanation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-3 bg-blue-900/20 border-l-4 border-blue-500 rounded text-blue-200 text-sm">
                    <strong>Пояснение:</strong> {task.explanation}
                </motion.div>
            )}
        </div>
    );
};

export default QuizTask;
