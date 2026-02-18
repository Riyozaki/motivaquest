
import React, { useState } from 'react';
import { Task } from '../../types';
import { Check, X, ArrowRight } from 'lucide-react';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean) => void;
}

const InputTask: React.FC<Props> = ({ task, onAnswer }) => {
    const [value, setValue] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    const checkAnswer = () => {
        if (!value.trim()) return;
        
        let isCorrect = false;
        const input = task.caseSensitive ? value.trim() : value.trim().toLowerCase();
        
        // Check main correct answer
        const main = task.caseSensitive ? task.correctAnswer : task.correctAnswer?.toLowerCase();
        if (input === main) isCorrect = true;

        // Check acceptables
        if (!isCorrect && task.acceptableAnswers) {
            isCorrect = task.acceptableAnswers.some(ans => {
                const a = task.caseSensitive ? ans : ans.toLowerCase();
                return input === a;
            });
        }

        setStatus(isCorrect ? 'correct' : 'incorrect');
        onAnswer(task.id, isCorrect);
    };

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-4 text-lg">{task.question}</h4>
            <div className="flex gap-2">
                <input
                    type={task.type === 'number_input' ? "number" : "text"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={status !== 'idle'}
                    placeholder="Твой ответ..."
                    className={`flex-1 bg-slate-900 border-2 rounded-xl px-4 py-3 outline-none transition-all
                        ${status === 'correct' ? 'border-emerald-500 text-emerald-400' : 
                          status === 'incorrect' ? 'border-red-500 text-red-400' : 
                          'border-slate-600 text-white focus:border-purple-500'}
                    `}
                    onKeyDown={(e) => e.key === 'Enter' && status === 'idle' && checkAnswer()}
                />
                <button 
                    onClick={checkAnswer}
                    disabled={status !== 'idle' || !value}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
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
        </div>
    );
};

export default InputTask;
