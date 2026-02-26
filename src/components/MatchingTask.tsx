import React, { useState } from 'react';
import { Task } from '../../types';
import { Lightbulb } from 'lucide-react';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean) => void;
    onHint?: (taskId: number) => boolean;
    isHinted?: boolean;
    hintsRemaining?: number;
}

// Fisher-Yates shuffle
const shuffle = (array: string[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const MatchingTask: React.FC<Props> = ({ task, onAnswer, onHint, isHinted = false, hintsRemaining = 0 }) => {
    const pairs = task.pairs || [];
    
    const [leftItems] = useState(() => shuffle(pairs.map(p => p.left)));
    const [rightItems] = useState(() => shuffle(pairs.map(p => p.right)));
    
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [matched, setMatched] = useState<Set<string>>(new Set());
    const [hintPair, setHintPair] = useState<{ left: string; right: string } | null>(null);
    const [mistakes, setMistakes] = useState(0);

    const handleLeftClick = (item: string) => {
        if (matched.has(item)) return;
        setSelectedLeft(item);
    };

    const handleRightClick = (item: string) => {
        if (!selectedLeft) return;
        
        const pair = pairs.find(p => p.left === selectedLeft);
        if (pair && pair.right === item) {
            const newMatched = new Set(matched);
            newMatched.add(selectedLeft);
            newMatched.add(item);
            setMatched(newMatched);
            setSelectedLeft(null);

            if (newMatched.size === pairs.length * 2) {
                onAnswer(task.id, true);
            }
        } else {
            setMistakes(m => m + 1);
            setSelectedLeft(null);
        }
    };

    // === HINT: Reveal one correct pair ===
    const handleHint = () => {
        if (!onHint || hintPair !== null) return;
        
        const success = onHint(task.id);
        if (!success) return;
        
        // Find an unmatched pair to reveal
        const unmatchedPairs = pairs.filter(p => !matched.has(p.left));
        if (unmatchedPairs.length === 0) return;
        
        const revealedPair = unmatchedPairs[0];
        setHintPair(revealedPair);
        
        // Auto-match the revealed pair
        const newMatched = new Set(matched);
        newMatched.add(revealedPair.left);
        newMatched.add(revealedPair.right);
        setMatched(newMatched);
        setSelectedLeft(null);
        
        // Check if all done after hint
        if (newMatched.size === pairs.length * 2) {
            onAnswer(task.id, true);
        }
    };

    const isDone = matched.size === pairs.length * 2;
    const canUseHint = !isDone && !isHinted && hintPair === null && (hintsRemaining ?? 0) > 0 && onHint;

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex items-start justify-between gap-2 mb-4">
                <h4 className="font-bold text-white text-lg">{task.question}</h4>
                
                {canUseHint && (
                    <button
                        onClick={handleHint}
                        className="shrink-0 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all group"
                        title="Подсказка: показать одну пару (−25% награды)"
                    >
                        <Lightbulb size={18} className="group-hover:drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                    </button>
                )}
            </div>

            {/* Hint indicator */}
            {hintPair && (
                <div className="mb-3 px-3 py-2 bg-amber-900/20 border border-amber-500/30 rounded-lg text-amber-300 text-sm flex items-center gap-2">
                    <Lightbulb size={14} className="shrink-0" />
                    Пара: {hintPair.left} → {hintPair.right}
                </div>
            )}

            <div className="flex gap-4 md:gap-8 justify-between">
                <div className="flex-1 space-y-2">
                    {leftItems.map(item => {
                        const isHintRevealed = hintPair?.left === item;
                        return (
                            <button
                                key={item}
                                onClick={() => handleLeftClick(item)}
                                disabled={matched.has(item) || isDone}
                                className={`w-full p-3 rounded-lg text-sm font-bold transition-all border-2
                                    ${matched.has(item) 
                                        ? isHintRevealed
                                            ? 'bg-amber-900/30 border-amber-500/50 text-amber-400 opacity-60'
                                            : 'bg-emerald-900/30 border-emerald-500 text-emerald-500 opacity-50'
                                        : selectedLeft === item 
                                            ? 'bg-purple-600 border-purple-400 text-white' 
                                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                                    }
                                `}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>
                <div className="flex-1 space-y-2">
                    {rightItems.map(item => {
                        const isHintRevealed = hintPair?.right === item;
                        return (
                            <button
                                key={item}
                                onClick={() => handleRightClick(item)}
                                disabled={matched.has(item) || isDone}
                                className={`w-full p-3 rounded-lg text-sm font-bold transition-all border-2
                                    ${matched.has(item) 
                                        ? isHintRevealed
                                            ? 'bg-amber-900/30 border-amber-500/50 text-amber-400 opacity-60'
                                            : 'bg-emerald-900/30 border-emerald-500 text-emerald-500 opacity-50'
                                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                                    }
                                `}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>
            </div>
            {isDone && <div className="mt-4 text-center text-emerald-400 font-bold">Все пары найдены! Ошибок: {mistakes}</div>}
        </div>
    );
};

export default MatchingTask;
