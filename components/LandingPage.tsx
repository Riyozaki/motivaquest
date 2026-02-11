import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => (
  <div className="text-center py-20 md:py-32 relative px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary-600/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black rpg-font mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] leading-tight">
            MOTIVA<span className="text-primary-500">QUEST</span>
          </h1>
          <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-light px-2">
            Твоя жизнь — это RPG. Спаси мир знаний, победив Тень Лени.
          </p>
          <Link to="/login" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-primary-600 text-base md:text-lg rounded-xl hover:bg-primary-700 hover:scale-105 shadow-[0_0_20px_rgba(var(--color-primary-600),0.5)]">
             <span className="mr-2">НАЧАТЬ ПУТЬ</span> <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
      </motion.div>
  </div>
);

export default LandingPage;