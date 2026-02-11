import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { api } from '../services/api';
import { Loader2, CloudOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SyncIndicator: React.FC = () => {
    const pendingCount = useSelector((state: RootState) => state.user.pendingSyncCount);
    const [isSyncing, setIsSyncing] = React.useState(false);

    const handleSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        await api.flushQueue();
        setIsSyncing(false);
    };

    return (
        <AnimatePresence>
            {pendingCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-4 left-4 z-50"
                >
                    <button
                        onClick={handleSync}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-slate-700/50 backdrop-blur-md transition-all
                            ${isSyncing 
                                ? 'bg-blue-900/80 text-blue-200 cursor-default' 
                                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 cursor-pointer hover:border-amber-500/50'
                            }
                        `}
                    >
                        <div className="relative">
                            {isSyncing ? (
                                <Loader2 className="animate-spin h-5 w-5 text-blue-400" />
                            ) : (
                                <CloudOff className="h-5 w-5 text-amber-500" />
                            )}
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                {pendingCount}
                            </span>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {isSyncing ? 'Синхронизация...' : 'Ожидание сети'}
                            </span>
                            <span className="text-[10px] opacity-70">
                                {isSyncing ? 'Отправка данных' : 'Нажмите, чтобы отправить'}
                            </span>
                        </div>
                        {!isSyncing && <RefreshCw size={14} className="ml-1 opacity-50" />}
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SyncIndicator;