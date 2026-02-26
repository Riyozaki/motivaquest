import React, { useState } from 'react';
import { Task } from '../../types';
import { ArrowUp, ArrowDown, Check, Lightbulb, Lock } from 'lucide-react';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean) => void;
    onHint?: (taskId: number) => boolean;
    isHinted?: boolean;
    hintsRemaining?: number;
}

const OrderingTask: React.FC<Props> = ({ task, onAnswer, onHint, isHinted = false, hintsRemaining = 0 }) => {
    const [items, setItems] = useState<string[]>(task.shuffledItems || []);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [lockedIndex, setLockedIndex] = useState<number | null>(null); // index in correctOrder that is locked

    const move = (idx: number, dir: -1 | 1) => {
        if (isSubmitted) return;
        // Don't move locked items
        if (lockedIndex !== null) {
            const lockedItem = task.correctOrder?.[lockedIndex];
            if (items[idx] === lockedItem || items[idx + dir] === lockedItem) {
                // Check if the locked item is already in correct position
                const lockedPos = items.indexOf(lockedItem || '');
                if (lockedPos === lockedIndex) return; // don't move locked item
            }
        }
        
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

    // === HINT: Place one item in its correct position and lock it ===
    const handleHint = () => {
        if (isSubmitted || !onHint || lockedIndex !== null) return;
        
        const success = onHint(task.id);
        if (!success) return;
        
        const correct = task.correctOrder || [];
        // Find an item that is NOT in its correct position
        const wrongIndices: number[] = [];
        items.forEach((item, idx) => {
            if (item !== correct[idx]) wrongIndices.push(idx);
        });
        
        if (wrongIndices.length === 0) return; // already correct
        
        // Pick the first wrong one and move it to correct position
        const targetCorrectIdx = wrongIndices[0];
        const targetItem = correct[targetCorrectIdx];
        const currentIdx = items.indexOf(targetItem);
        
        if (currentIdx === -1) return;
        
        // Swap to correct position
        const newItems = [...items];
        newItems[currentIdx] = newItems[targetCorrectIdx];
        newItems[targetCorrectIdx] = targetItem;
        setItems(newItems);
        setLockedIndex(targetCorrectIdx);
    };

    const canUseHint = !isSubmitted && !isHinted && lockedIndex === null && (hintsRemaining ?? 0) > 0 && onHint;

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-start justify-between gap-2 mb-4">
                <h4 className="font-bold text-white text-lg">{task.question}</h4>
                
                {canUseHint && (
                    <button
                        onClick={handleHint}
                        className="shrink-0 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all group"
                        title="Подсказка: поставить один элемент на место (−25% награды)"
                    >
                        <Lightbulb size={18} className="group-hover:drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                    </button>
                )}
            </div>

            <div className="space-y-2 mb-4">
                {items.map((item, idx) => {
                    const isLocked = lockedIndex !== null && idx === lockedIndex && item === task.correctOrder?.[lockedIndex];
                    
                    return (
                        <div key={idx} className={`p-3 rounded-lg border flex justify-between items-center transition-all
                            ${isLocked 
                                ? 'bg-emerald-900/30 border-emerald-500/50 ring-1 ring-emerald-500/30' 
                                : 'bg-slate-900 border-slate-600'
                            }
                        `}>
                            <span className={`${isLocked ? 'text-emerald-300' : 'text-slate-200'} flex items-center gap-2`}>
                                {isLocked && <Lock size={14} className="text-emerald-400" />}
                                {item}
                            </span>
                            {!isSubmitted && !isLocked && (
                                <div className="flex gap-1">
                                    <button disabled={idx === 0} onClick={() => move(idx, -1)} className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"><ArrowUp size={16} /></button>
                                    <button disabled={idx === items.length - 1} onClick={() => move(idx, 1)} className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"><ArrowDown size={16} /></button>
                                </div>
                            )}
                            {isLocked && !isSubmitted && (
                                <span className="text-xs text-emerald-400/60 font-bold">✓ На месте</span>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {!isSubmitted ? (
                <button onClick={submit} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl">
                    Проверить Порядок
                </button>
            ) : (
                <div className={`p-3 rounded border-l-4 text-sm ${isCorrect ? 'bg-emerald-900/20 border-emerald-500 text-emerald-300' : 'bg-red-900/20 border-red-500 text-red-300'}`}>
                    {isCorrect ? 'Верный порядок!' : 'Неверно. Попробуй ещё раз в следующий раз.'}
                </div>
            )}
        </div>
    );
};

export default OrderingTask;
