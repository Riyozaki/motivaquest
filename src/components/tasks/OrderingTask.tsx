
import React, { useState } from 'react';
import { Task } from '../../types';
import { ArrowUp, ArrowDown, Check } from 'lucide-react';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean) => void;
}

const OrderingTask: React.FC<Props> = ({ task, onAnswer }) => {
    const [items, setItems] = useState<string[]>(task.shuffledItems || []);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const move = (idx: number, dir: -1 | 1) => {
        if (isSubmitted) return;
        const newItems = [...items];
        const temp = newItems[idx];
        newItems[idx] = newItems[idx + dir];
        newItems[idx + dir] = temp;
        setItems(newItems);
    };

    const submit = () => {
        setIsSubmitted(true);
        const correct = JSON.stringify(items) === JSON.stringify(task.correctOrder);
        setIsCorrect(correct);
        onAnswer(task.id, correct);
    };

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-4 text-lg">{task.question}</h4>
            <div className="space-y-2 mb-4">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-600 flex justify-between items-center">
                        <span className="text-slate-200">{item}</span>
                        {!isSubmitted && (
                            <div className="flex gap-1">
                                <button disabled={idx === 0} onClick={() => move(idx, -1)} className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"><ArrowUp size={16} /></button>
                                <button disabled={idx === items.length - 1} onClick={() => move(idx, 1)} className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"><ArrowDown size={16} /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {!isSubmitted ? (
                <button onClick={submit} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl">
                    Проверить Порядок
                </button>
            ) : (
                <div className={`p-3 rounded border-l-4 text-sm ${isCorrect ? 'bg-emerald-900/20 border-emerald-500 text-emerald-300' : 'bg-red-900/20 border-red-500 text-red-300'}`}>
                    {isCorrect ? 'Верный порядок!' : 'Неверно. Попробуй еще раз в следующий раз.'}
                </div>
            )}
        </div>
    );
};

export default OrderingTask;
