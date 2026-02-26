import React, { useState } from 'react';
import { Task } from '../../types';
import { Check, X, ArrowRight, Lightbulb } from 'lucide-react';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean) => void;
    onHint?: (taskId: number) => boolean;
    isHinted?: boolean;
    hintsRemaining?: number;
}

const InputTask: React.FC<Props> = ({ task, onAnswer, onHint, isHinted = false, hintsRemaining = 0 }) => {
    const [value, setValue] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [hintText, setHintText] = useState<string | null>(null);

    const checkAnswer = () => {
        if (status !== 'idle') return;
        
        const userVal = value.trim();
        const correctVal = (task.correctAnswer || '').trim();
        
        // Special wildcard — any non-empty answer is correct
        if (correctVal === '*') {
            const isCorrect = userVal.length > 0;
            setStatus(isCorrect ? 'correct' : 'incorrect');
            onAnswer(task.id, isCorrect);
            return;
        }

        let isCorrect = false;
        
        if (task.type === 'number_input') {
            isCorrect = userVal === correctVal;
        } else {
            const compare = task.caseSensitive ? (a: string, b: string) => a === b : (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
            isCorrect = compare(userVal, correctVal);
            
            // Check acceptable alternatives
            if (!isCorrect && task.acceptableAnswers) {
                isCorrect = task.acceptableAnswers.some(alt => compare(userVal, alt.trim()));
            }
        }

        setStatus(isCorrect ? 'correct' : 'incorrect');
        onAnswer(task.id, isCorrect);
    };

    // === HINT: Show first characters of the answer ===
    const handleHint = () => {
        if (status !== 'idle' || !onHint || hintText !== null) return;
        
        const success = onHint(task.id);
        if (!success) return;
        
        const correct = (task.correctAnswer || '').trim();
        if (correct === '*') {
            setHintText("Любой ответ подойдёт");
            return;
        }
        
        // Show first ~40% of the answer
        const revealLen = Math.max(1, Math.ceil(correct.length * 0.4));
        const revealed = correct.substring(0, revealLen);
        setHintText(`Начинается с: "${revealed}..."`);
    };

    const canUseHint = status === 'idle' && !isHinted && hintText === null && (hintsRemaining ?? 0) > 0 && onHint;

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-start justify-between gap-2 mb-4">
                <h4 className="font-bold text-white text-lg">{task.question}</h4>
                
                {canUseHint && (
                    <button
                        onClick={handleHint}
                        className="shrink-0 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all group"
                        title="Подсказка: показать начало ответа (−25% награды)"
                    >
                        <Lightbulb size={18} className="group-hover:drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                    </button>
                )}
            </div>
            
            {/* Hint display */}
            {hintText && status === 'idle' && (
                <div className="mb-3 px-3 py-2 bg-amber-900/20 border border-amber-500/30 rounded-lg text-amber-300 text-sm flex items-center gap-2">
                    <Lightbulb size={14} className="shrink-0" />
                    {hintText}
                </div>
            )}

            <div className="flex gap-2">
                <input 
                    type={task.type === 'number_input' ? 'number' : 'text'}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    disabled={status !== 'idle'}
                    placeholder="Введи ответ..."
                    onKeyDown={e => e.key === 'Enter' && checkAnswer()}
                    className={`flex-1 bg-slate-900 border p-3 rounded-lg text-white text-sm outline-none transition-colors
                        ${status === 'correct' ? 'border-emerald-500' : status === 'incorrect' ? 'border-red-500' : 'border-slate-600 focus:border-purple-500'}
                    `}
                />
                <button 
                    onClick={checkAnswer}
                    disabled={status !== 'idle' || !value.trim()}
                    className={`px-4 py-3 rounded-lg font-bold text-white transition-all ${
                        status === 'correct' ? 'bg-emerald-600' : status === 'incorrect' ? 'bg-red-600' : 'bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500'
                    }`}
                >
                    {status === 'correct' ? <Check /> : status === 'incorrect' ? <X /> : <ArrowRight />}
                </button>
            </div>
            {status !== 'idle' && task.explanation && (
                <div className="mt-4 p-3 bg-blue-900/20 border-l-4 border-blue-500 rounded text-blue-200 text-sm">
                   {status === 'incorrect' && <div className="font-bold mb-1">Правильный ответ: {task.correctAnswer}</div>}
                   {task.explanation}
                </div>
            )}
            {status === 'incorrect' && !task.explanation && (
                <div className="mt-3 p-3 bg-red-900/20 border-l-4 border-red-500 rounded text-red-200 text-sm">
                    Правильный ответ: <strong>{task.correctAnswer}</strong>
                </div>
            )}
        </div>
    );
};

export default InputTask;
