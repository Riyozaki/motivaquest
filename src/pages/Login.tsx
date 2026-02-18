import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, AlertCircle, ShieldCheck, Sword, Gamepad2, Sparkles } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { loginLocal, registerLocal, loginDemo } from '../store/userSlice';
import { AppDispatch } from '../store';
import Modal from 'react-modal';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleDemoLogin = async () => {
      setLoading(true);
      await dispatch(loginDemo());
      navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Заполните поля, путник.');
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        setError('Неверный формат магической почты');
        return;
    }

    if (!isLogin && !hasConsent) {
      setError('Нужно согласие старейшин (родителей).');
      setShowConsentModal(true);
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
         await dispatch(loginLocal({ email: formData.email, password: formData.password })).unwrap();
      } else {
        if (!formData.username) throw new Error('Назови себя!');
        await dispatch(registerLocal({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          hasConsent
        })).unwrap();
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ошибка в заклинании входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-slate-950">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950"></div>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass-panel p-8 rounded-3xl shadow-[0_0_50px_rgba(124,58,237,0.1)] relative z-10 border border-slate-700/50"
      >
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 relative">
             <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 rounded-full"></div>
             <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-4 rounded-2xl shadow-xl relative">
                <Sword className="w-10 h-10 text-white" />
             </div>
          </div>
          <h2 className="text-3xl font-black rpg-font text-white tracking-wider mb-2">
            {isLogin ? 'Врата Героев' : 'Новая Легенда'}
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            "Только знания откроют путь к величию"
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-red-900/30 border border-red-500/30 text-red-200 rounded-xl text-center text-sm flex items-center justify-center">
            <AlertCircle className="inline h-4 w-4 mr-2" />
            {error}
          </motion.div>
        )}

        {/* Demo Button */}
        <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full mb-6 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-t border-white/20 rounded-xl text-white font-bold shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-95 group"
        >
            <Gamepad2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Демо-Режим (Начать Сразу)</span>
        </button>

        <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase font-bold tracking-wider">Или магия пароля</span>
            <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Имя Героя</label>
                <div className="relative">
                  <UserIcon className="absolute top-3 left-3 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-600 transition-all outline-none"
                    placeholder="Артур"
                  />
                </div>
              </div>

              <div className="flex items-start bg-slate-900/30 p-3 rounded-xl border border-slate-700/50">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => setHasConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 text-purple-600 bg-slate-800 border-slate-600 rounded focus:ring-purple-500"
                  />
                <label htmlFor="consent" className="ml-3 text-xs text-slate-400">
                  Клянусь, что мои родители знают о моем походе (Согласие).
                </label>
              </div>
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Магическая Почта</label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-5 w-5 text-slate-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-600 transition-all outline-none"
                placeholder="hero@realm.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Тайный Шифр</label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-5 w-5 text-slate-500" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-600 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border-t border-white/20 rounded-xl font-bold text-white shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-all transform hover:-translate-y-1"
          >
            {loading ? <Sparkles className="animate-spin h-5 w-5 mx-auto" /> : (isLogin ? 'Войти в мир' : 'Создать Легенду')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ email: '', password: '', username: '' });
            }}
            className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            {isLogin ? 'Нет свитка? Напиши новый' : 'Уже есть свиток? Открыть'}
          </button>
        </div>
      </motion.div>

      <Modal
        isOpen={showConsentModal}
        onRequestClose={() => setShowConsentModal(false)}
        className="max-w-md w-full mx-auto mt-20 glass-panel p-6 rounded-2xl border border-amber-500/30 outline-none"
        overlayClassName="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-amber-500 mx-auto mb-4 drop-shadow-lg" />
          <h3 className="text-2xl font-bold mb-2 rpg-font text-white">Кодекс Чести</h3>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Юные герои должны иметь разрешение старших для вступления в гильдию. Подтвердите это.
          </p>
          <button
            onClick={() => {
              setHasConsent(true);
              setShowConsentModal(false);
            }}
            className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-500 w-full shadow-lg"
          >
            Я подтверждаю
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Login;