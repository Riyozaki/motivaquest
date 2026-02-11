
import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isLoading: boolean;
    children: React.ReactNode;
    message?: string;
    className?: string;
}

const LoadingOverlay: React.FC<Props> = ({ isLoading, children, message = "Загрузка...", className = "" }) => {
    return (
        <div className={`relative ${className}`}>
            {children}
            <AnimatePresence>
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-inherit"
                        style={{ borderRadius: 'inherit' }}
                    >
                        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-2" />
                        {message && <span className="text-white text-xs font-bold uppercase tracking-wider">{message}</span>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoadingOverlay;
