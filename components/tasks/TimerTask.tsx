import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import { Timer, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean, isPartial?: boolean) => void;
}

const TimerTask: React.FC<Props> = ({ task, onAnswer }) => {
    const [timeLeft, setTimeLeft] = useState(task.timerSeconds || 30);
    const [isActive, setIsActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [input, setInput] = useState('');
    const [result, setResult] = useState<'success' | 'fail' | null>(null);

    useEffect(() => {
        let interval: any;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        finish(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const start = () => setIsActive(true);

    const finish = (submitted: boolean) => {
        setIsActive(false);
        setIsFinished(true);
        
        if (!submitted) {
            // Time ran out
            setResult('fail');
            onAnswer(task.id, false, true); // Partial credit for trying? Or fail. Let's give partial if time out but maybe they knew. Actually strict fail for timer usually. Let's do partial=true meaning "failed but acknowledged".
        } else {
            // Check answer
            const isCorrect = input.trim() === task.correctAnswer || (task.acceptableAnswers && task.acceptableAnswers.includes(input.trim()));
            setResult(isCorrect ? 'success' : 'fail');
            onAnswer(task.id, isCorrect);
        }
    };

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-white text-lg">{task.question}</h4>
                <div className={`flex items-center gap-1 font-mono font-bold text-xl ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
                    <Timer size={20} /> {timeLeft}s
                </div>
            </div>

            {!isActive && !isFinished ? (
                <div className="text-center py-6">
                    <p className="text-slate-400 mb-4 text-sm">Приготовься! Время пойдет сразу после нажатия.</p>
                    <button onClick={start} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-xl transition-transform active:scale-95">
                        Начать Испытание
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isFinished}
                        autoFocus
                        placeholder="Быстро введи ответ..."
                        className="w-full bg-slate-900 border-2 border-slate-600 rounded-xl px-4 py-3 text-white text-center text-xl font-mono focus:border-purple-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && !isFinished && finish(true)}
                    />
                    {!isFinished && (
                        <button onClick={() => finish(true)} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl">
                            Ответить
                        </button>
                    )}
                </div>
            )}

            {isFinished && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-4 p-3 rounded border-l-4 text-sm ${result === 'success' ? 'bg-emerald-900/20 border-emerald-500 text-emerald-300' : 'bg-red-900/20 border-red-500 text-red-300'}`}>
                    {result === 'success' ? 'Отлично! Уложился вовремя.' : `Время вышло или ответ неверен. Правильно: ${task.correctAnswer}`}
                    {task.explanation && <div className="mt-1 opacity-80">{task.explanation}</div>}
                </motion.div>
            )}
        </div>
    );
};

export default TimerTask;