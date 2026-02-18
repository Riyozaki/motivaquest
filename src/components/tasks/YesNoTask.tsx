
import React, { useState } from 'react';
import { Task } from '../../types';
import { Check, X, MinusCircle } from 'lucide-react';

interface Props {
    task: Task;
    onAnswer: (taskId: number, isCorrect: boolean, isPartial?: boolean) => void;
}

const YesNoTask: React.FC<Props> = ({ task, onAnswer }) => {
    const [status, setStatus] = useState<'yes' | 'no' | 'partial' | null>(null);

    const handle = (val: 'yes' | 'no' | 'partial') => {
        setStatus(val);
        if (val === 'yes') onAnswer(task.id, true);
        else if (val === 'partial') onAnswer(task.id, false, true);
        else onAnswer(task.id, false);
    };

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-4 text-lg">{task.question}</h4>
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => handle('yes')}
                    className={`py-3 rounded-lg font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 border-2
                        ${status === 'yes' 
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-300'
                        }
                    `}
                >
                    <Check size={18} /> Да
                </button>
                <button
                    onClick={() => handle('partial')}
                    className={`py-3 rounded-lg font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 border-2
                        ${status === 'partial' 
                            ? 'bg-amber-600/20 border-amber-500 text-amber-400' 
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-amber-500/50 hover:text-amber-300'
                        }
                    `}
                >
                    <MinusCircle size={18} /> Частично
                </button>
                <button
                    onClick={() => handle('no')}
                    className={`py-3 rounded-lg font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 border-2
                        ${status === 'no' 
                            ? 'bg-red-600/20 border-red-500 text-red-400' 
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-300'
                        }
                    `}
                >
                    <X size={18} /> Нет
                </button>
            </div>
        </div>
    );
};

export default YesNoTask;
