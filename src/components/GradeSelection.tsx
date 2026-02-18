import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GRADE_GROUPS, GradeGroup, GradeGroupInfo } from '../data/questTypes';

interface GradeSelectionProps {
  onSelect: (gradeGroup: GradeGroup) => void;
}

const GradeSelection: React.FC<GradeSelectionProps> = ({ onSelect }) => {
  const [selected, setSelected] = useState<GradeGroup | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (group: GradeGroupInfo) => {
    setSelected(group.id);
  };

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        {/* Заголовок */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: "'Cinzel', serif", color: '#a78bfa' }}
          >
            Выбери свой путь
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-lg"
          >
            В каком классе ты учишься? От этого зависят твои квесты
          </motion.p>
        </div>

        {/* Карточки классов */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {GRADE_GROUPS.map((group, index) => (
            <motion.button
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              onClick={() => handleSelect(group)}
              className="relative p-5 rounded-xl text-left transition-all duration-300 focus:outline-none"
              style={{
                background: selected === group.id
                  ? `linear-gradient(135deg, ${group.color}22, ${group.color}11)`
                  : 'rgba(30, 41, 59, 0.6)',
                border: selected === group.id
                  ? `2px solid ${group.color}`
                  : '2px solid rgba(148, 163, 184, 0.15)',
                boxShadow: selected === group.id
                  ? `0 0 20px ${group.color}33`
                  : 'none',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Иконка выбора */}
              {selected === group.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: group.color }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
              )}

              <div className="text-3xl mb-2">{group.icon}</div>
              <h3
                className="text-xl font-bold mb-1"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: selected === group.id ? group.color : '#e2e8f0',
                }}
              >
                {group.label}
              </h3>
              <p className="text-sm text-slate-400">{group.description}</p>

              {/* Классы */}
              <div className="flex gap-2 mt-3">
                {group.grades.map((g) => (
                  <span
                    key={g}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: `${group.color}22`,
                      color: group.color,
                      border: `1px solid ${group.color}44`,
                    }}
                  >
                    {g} класс
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Кнопка подтверждения */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-center"
            >
              <motion.button
                onClick={handleConfirm}
                className="px-8 py-3 rounded-xl font-bold text-lg text-white transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${GRADE_GROUPS.find(g => g.id === selected)?.color || '#a78bfa'}, #7c3aed)`,
                  boxShadow: `0 4px 15px ${GRADE_GROUPS.find(g => g.id === selected)?.color || '#a78bfa'}44`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Начать приключение 🚀
              </motion.button>
              <p className="text-xs text-slate-500 mt-3">
                Выбор можно будет изменить в настройках
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GradeSelection;
