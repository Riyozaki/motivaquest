import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Bar, Scatter } from 'react-chartjs-2';
import { ShieldAlert, Users, TrendingUp, BookOpen, Clock, EyeOff, Scroll } from 'lucide-react';
import { ChartData, ChartOptions } from 'chart.js';
import { motion } from 'framer-motion';

const Admin: React.FC = () => {
  const studentData = useSelector((state: RootState) => state.admin.studentData);

  const anonymizeName = (name: string, id: number) => {
    return `Адепт #${id}`; 
  };

  // --- Charts Styling ---
  const chartOptions: ChartOptions<'bar' | 'scatter'> = {
    responsive: true,
    plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: '"Exo 2"' } } },
    },
    scales: {
        x: { 
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#64748b' } 
        },
        y: { 
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#64748b' }
        }
    }
  };

  // 1. Quests vs Time (Bar)
  const activityData: ChartData<'bar'> = {
    labels: studentData.map(s => anonymizeName(s.studentName, s.studentId)),
    datasets: [
      {
        label: 'Время (мин)',
        data: studentData.map(s => s.appTimeMinutes),
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Квесты',
        data: studentData.map(s => s.completedQuests),
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 4,
      }
    ],
  };

  // 2. Correlation
  const correlationData: ChartData<'scatter'> = {
    datasets: [{
      label: 'Успеваемость vs Мотивация',
      data: studentData.map(s => ({
        x: s.avgMotivation,
        y: s.grade
      })),
      backgroundColor: '#10b981',
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8 border-b border-slate-700/50 pb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-900/20 rounded-xl text-red-500 border border-red-500/30">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white rpg-font">Магистериум</h1>
            <p className="text-slate-400 text-sm">Панель управления орденом</p>
          </div>
        </div>
        <div className="flex items-center px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full text-xs text-slate-400">
           <EyeOff className="h-3 w-3 mr-2" />
           Режим скрытности активирован
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="glass-panel p-6 rounded-2xl">
           <div className="flex items-center text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider"><Users className="h-4 w-4 mr-2"/> Адептов</div>
           <div className="text-3xl font-black text-white">{studentData.length}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl">
           <div className="flex items-center text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider"><BookOpen className="h-4 w-4 mr-2"/> Ср. Балл</div>
           <div className="text-3xl font-black text-purple-400">
             {Math.round(studentData.reduce((acc, s) => acc + s.grade, 0) / studentData.length)}
           </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl">
           <div className="flex items-center text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider"><Clock className="h-4 w-4 mr-2"/> Активность</div>
           <div className="text-3xl font-black text-blue-400">
             {Math.round(studentData.reduce((acc, s) => acc + s.appTimeMinutes, 0) / studentData.length)} <span className="text-sm text-slate-500">мин</span>
           </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 rounded-2xl">
           <div className="flex items-center text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider"><TrendingUp className="h-4 w-4 mr-2"/> Мотивация</div>
           <div className="text-3xl font-black text-emerald-400">
             {(studentData.reduce((acc, s) => acc + s.avgMotivation, 0) / studentData.length).toFixed(1)}
           </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-6 text-slate-200 flex items-center gap-2"><Scroll size={18} /> Активность Ордена</h3>
          <Bar data={activityData} options={chartOptions as any} />
        </div>

        {/* Correlation Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-6 text-slate-200 flex items-center gap-2"><TrendingUp size={18} /> Магия Чисел</h3>
          <Scatter 
            data={correlationData} 
            options={{
              ...chartOptions,
              scales: {
                x: { ...chartOptions.scales?.x, title: { display: true, text: 'Мотивация', color: '#64748b' }, min: 1, max: 5 },
                y: { ...chartOptions.scales?.y, title: { display: true, text: 'Успеваемость (%)', color: '#64748b' }, min: 50, max: 100 }
              }
            } as any} 
          />
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50">
           <h3 className="font-bold text-slate-200">Архив Данных (Анонимно)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="bg-slate-900/80 text-slate-500 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Имя (Шифр)</th>
                <th className="px-6 py-4">Оценка</th>
                <th className="px-6 py-4">Время (мин)</th>
                <th className="px-6 py-4">Квесты</th>
                <th className="px-6 py-4">Мотивация</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {studentData.map(student => (
                <tr key={student.studentId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-200">{anonymizeName(student.studentName, student.studentId)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                        student.grade >= 90 ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30' : 
                        student.grade >= 75 ? 'bg-amber-900/20 text-amber-400 border-amber-500/30' : 
                        'bg-red-900/20 text-red-400 border-red-500/30'
                    }`}>
                      {student.grade}%
                    </span>
                  </td>
                  <td className="px-6 py-4">{student.appTimeMinutes}</td>
                  <td className="px-6 py-4">{student.completedQuests}</td>
                  <td className="px-6 py-4">
                     <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full" style={{ width: `${(student.avgMotivation / 5) * 100}%` }}></div>
                     </div>
                     <span className="text-xs mt-1 block">{student.avgMotivation}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;