
import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../../types';
import { CheckSquare, Square } from 'lucide-react';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean, isPartial?: boolean) => void;
}

const ChecklistTask: React.FC<Props> = ({ task, onAnswer }) => {
    const [checked, setChecked] = useState<string[]>([]);
    
    // Store latest onAnswer callback in ref to avoid effect dependency loop
    const onAnswerRef = useRef(onAnswer);
    useEffect(() => {
        onAnswerRef.current = onAnswer;
    }, [onAnswer]);

    const items = task.checklistItems || [];
    const total = items.length;

    const toggle = (id: string) => {
        const newChecked = checked.includes(id) 
            ? checked.filter(c => c !== id) 
            : [...checked, id];
        
        setChecked(newChecked);
    };

    // Auto-update parent
    useEffect(() => {
        if (total === 0) return;
        const allChecked = checked.length === total;
        const someChecked = checked.length > 0;
        
        // Use ref to call function without triggering re-run when function identity changes
        if (allChecked) {
            onAnswerRef.current(task.id, true);
        } else if (someChecked) {
            onAnswerRef.current(task.id, false, true); // Partial
        }
    }, [checked, total, task.id]); // Removed onAnswer from dependencies

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-4 text-lg">{task.question}</h4>
            <div className="space-y-2">
                {items.map(item => {
                    const isChecked = checked.includes(item.id);
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => toggle(item.id)}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border ${isChecked ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}`}
                        >
                            <div className={`mr-3 ${isChecked ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                            </div>
                            <span className={isChecked ? 'text-slate-200 line-through opacity-70' : 'text-white'}>{item.label}</span>
                        </div>
                    )
                })}
            </div>
            <div className="mt-4 text-xs text-right text-slate-500">
                {checked.length} из {total} выполнено
            </div>
        </div>
    );
};

export default ChecklistTask;
