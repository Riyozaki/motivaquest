import React, { useState } from 'react';
import { Task } from '../../types';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean) => void;
}

// Fisher-Yates shuffle algorithm
const shuffle = (array: string[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const MatchingTask: React.FC<Props> = ({ task, onAnswer }) => {
    // Flatten pairs for UI
    const pairs = task.pairs || [];
    
    // Initialize state with shuffled arrays using Fisher-Yates
    const [leftItems] = useState(() => shuffle(pairs.map(p => p.left)));
    const [rightItems] = useState(() => shuffle(pairs.map(p => p.right)));
    
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [matched, setMatched] = useState<Set<string>>(new Set());
    const [mistakes, setMistakes] = useState(0);

    const handleLeftClick = (item: string) => {
        if (matched.has(item)) return;
        setSelectedLeft(item);
    };

    const handleRightClick = (item: string) => {
        if (!selectedLeft) return;
        
        // Find correct pair
        const pair = pairs.find(p => p.left === selectedLeft);
        if (pair && pair.right === item) {
            // Match!
            const newMatched = new Set(matched);
            newMatched.add(selectedLeft);
            newMatched.add(item);
            setMatched(newMatched);
            setSelectedLeft(null);

            if (newMatched.size === pairs.length * 2) {
                onAnswer(task.id, true); // Done
            }
        } else {
            // Wrong
            setMistakes(m => m + 1);
            setSelectedLeft(null);
            // Shake effect could go here
        }
    };

    const isDone = matched.size === pairs.length * 2;

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-4 text-lg">{task.question}</h4>
            <div className="flex gap-8 justify-between">
                <div className="flex-1 space-y-2">
                    {leftItems.map(item => (
                        <button
                            key={item}
                            onClick={() => handleLeftClick(item)}
                            disabled={matched.has(item) || isDone}
                            className={`w-full p-3 rounded-lg text-sm font-bold transition-all border-2
                                ${matched.has(item) ? 'bg-emerald-900/30 border-emerald-500 text-emerald-500 opacity-50' : 
                                  selectedLeft === item ? 'bg-purple-600 border-purple-400 text-white' : 
                                  'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'}
                            `}
                        >
                            {item}
                        </button>
                    ))}
                </div>
                <div className="flex-1 space-y-2">
                    {rightItems.map(item => (
                        <button
                            key={item}
                            onClick={() => handleRightClick(item)}
                            disabled={matched.has(item) || isDone}
                            className={`w-full p-3 rounded-lg text-sm font-bold transition-all border-2
                                ${matched.has(item) ? 'bg-emerald-900/30 border-emerald-500 text-emerald-500 opacity-50' : 
                                  'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'}
                            `}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
            {isDone && <div className="mt-4 text-center text-emerald-400 font-bold">Все пары найдены! Ошибок: {mistakes}</div>}
        </div>
    );
};

export default MatchingTask;