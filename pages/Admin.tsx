import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Bar, Line, Scatter } from 'react-chartjs-2';
import { ShieldAlert, Users, TrendingUp, BookOpen, Clock, EyeOff } from 'lucide-react';
import { ChartData } from 'chart.js';

const Admin: React.FC = () => {
  const studentData = useSelector((state: RootState) => state.admin.studentData);

  // Privacy: Anonymize names function
  const anonymizeName = (name: string, id: number) => {
    return `Студент #${id}`; 
  };

  // --- Charts Data Preparation ---

  // 1. Quests vs Time (Bar)
  const activityData: ChartData<'bar'> = {
    labels: studentData.map(s => anonymizeName(s.studentName, s.studentId)),
    datasets: [
      {
        label: 'Время в приложении (мин)',
        data: studentData.map(s => s.appTimeMinutes),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Выполнено квестов',
        data: studentData.map(s => s.completedQuests),
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 1,
        yAxisID: 'y1',
      }
    ],
  };

  // 2. Correlation: Motivation vs Grades (Scatter)
  const correlationData: ChartData<'scatter'> = {
    datasets: [{
      label: 'Успеваемость vs Мотивация',
      data: studentData.map(s => ({
        x: s.avgMotivation,
        y: s.grade
      })),
      backgroundColor: 'rgb(255, 99, 132)',
    }]
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-lg text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Панель Педагога</h1>
            <p className="text-gray-500">Мониторинг активности и успеваемости класса</p>
          </div>
        </div>
        <div className="flex items-center px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-500">
           <EyeOff className="h-3 w-3 mr-2" />
           Режим конфиденциальности включен
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center text-gray-500 mb-2"><Users className="h-4 w-4 mr-2"/> Студентов</div>
           <div className="text-3xl font-bold text-gray-900">{studentData.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center text-gray-500 mb-2"><BookOpen className="h-4 w-4 mr-2"/> Средний балл</div>
           <div className="text-3xl font-bold text-indigo-600">
             {Math.round(studentData.reduce((acc, s) => acc + s.grade, 0) / studentData.length)}
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center text-gray-500 mb-2"><Clock className="h-4 w-4 mr-2"/> Среднее время</div>
           <div className="text-3xl font-bold text-blue-600">
             {Math.round(studentData.reduce((acc, s) => acc + s.appTimeMinutes, 0) / studentData.length)} м
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center text-gray-500 mb-2"><TrendingUp className="h-4 w-4 mr-2"/> Мотивация (1-5)</div>
           <div className="text-3xl font-bold text-green-600">
             {(studentData.reduce((acc, s) => acc + s.avgMotivation, 0) / studentData.length).toFixed(1)}
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Активность студентов</h3>
          <Bar 
            data={activityData} 
            options={{
              responsive: true,
              interaction: { mode: 'index', intersect: false },
              scales: {
                y: { type: 'linear', display: true, position: 'left' },
                y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } },
              }
            }} 
          />
        </div>

        {/* Correlation Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Корреляция: Мотивация и Оценки</h3>
          <Scatter 
            data={correlationData} 
            options={{
              scales: {
                x: { title: { display: true, text: 'Уровень Мотивации (1-5)' }, min: 1, max: 5 },
                y: { title: { display: true, text: 'Успеваемость (%)' }, min: 50, max: 100 }
              }
            }} 
          />
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
           <h3 className="font-bold text-gray-800">Детальный список (Анонимно)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Оценка</th>
                <th className="px-6 py-3">Время (мин)</th>
                <th className="px-6 py-3">Квесты</th>
                <th className="px-6 py-3">Мотивация</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {studentData.map(student => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{anonymizeName(student.studentName, student.studentId)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${student.grade >= 90 ? 'bg-green-100 text-green-700' : student.grade >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {student.grade}%
                    </span>
                  </td>
                  <td className="px-6 py-4">{student.appTimeMinutes}</td>
                  <td className="px-6 py-4">{student.completedQuests}</td>
                  <td className="px-6 py-4">{student.avgMotivation}</td>
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