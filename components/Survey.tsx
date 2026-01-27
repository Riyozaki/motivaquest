import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { submitSurvey } from '../store/userSlice';
import { ClipboardList, Smile, Check } from 'lucide-react';

const Survey: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.currentUser);
  
  const [isOpen, setIsOpen] = useState(false);
  const [scores, setScores] = useState({
    motivation: 3,
    stress: 3,
    enjoyment: 3
  });

  if (!user) return null;

  // Check if survey taken this week (simplified: taken at all for demo)
  const hasTakenSurvey = user.surveyHistory && user.surveyHistory.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(submitSurvey({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      motivationScore: scores.motivation,
      stressScore: scores.stress,
      enjoymentScore: scores.enjoyment
    }));
    setIsOpen(false);
  };

  if (hasTakenSurvey) {
    return (
      <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Опрос пройден</h4>
            <p className="text-sm text-gray-600">Спасибо за обратную связь на этой неделе!</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Еженедельный чек-ин</h4>
            <p className="text-sm text-gray-600">Поделись, как прошел твой учебный путь.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold"
        >
          Пройти
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
      <h3 className="font-bold text-xl mb-4 text-gray-800">Как твои дела?</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Насколько ты мотивирован учиться? (1-5)</label>
          <input 
            type="range" min="1" max="5" 
            value={scores.motivation} 
            onChange={(e) => setScores({...scores, motivation: parseInt(e.target.value)})}
            className="w-full accent-indigo-600" 
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Вообще нет</span>
            <span>Очень сильно</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Как уровень стресса? (1-5)</label>
          <input 
            type="range" min="1" max="5" 
            value={scores.stress} 
            onChange={(e) => setScores({...scores, stress: parseInt(e.target.value)})}
            className="w-full accent-red-500" 
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
             <span>Расслаблен</span>
             <span>Паника</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Тебе понравилось выполнять квесты? (1-5)</label>
          <input 
            type="range" min="1" max="5" 
            value={scores.enjoyment} 
            onChange={(e) => setScores({...scores, enjoyment: parseInt(e.target.value)})}
            className="w-full accent-yellow-500" 
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
             <span>Скучно</span>
             <span>Супер!</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
          >
            Отмена
          </button>
          <button 
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
          >
            Отправить
          </button>
        </div>
      </form>
    </div>
  );
};

export default Survey;