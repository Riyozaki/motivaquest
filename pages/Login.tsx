
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, AlertCircle, ShieldCheck, Sword, Gamepad2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { loginLocal, registerLocal, loginDemo } from '../store/userSlice';
import { AppDispatch } from '../store';
import Modal from 'react-modal';

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
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4 font-serif">
      <div className="max-w-md w-full bg-stone-800 p-8 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] border-4 border-double border-yellow-700 text-amber-50">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 text-yellow-500">
             <Sword className="w-16 h-16 drop-shadow-lg" />
          </div>
          <h2 className="text-4xl font-bold rpg-font text-yellow-500 tracking-wider">
            {isLogin ? 'Врата Героев' : 'Новая Легенда'}
          </h2>
          <p className="text-stone-400 mt-2 italic">
            "Только знания откроют путь к величию"
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded text-center text-sm">
            <AlertCircle className="inline h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {/* Demo Button */}
        <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full mb-6 py-4 px-4 bg-gradient-to-r from-green-700 to-emerald-800 hover:from-green-600 hover:to-emerald-700 border-2 border-green-500 rounded-lg text-white font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-95"
        >
            <Gamepad2 className="w-6 h-6" />
            <span>Демо-Режим (Начать Сразу)</span>
        </button>

        <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-stone-600"></div>
            <span className="flex-shrink-0 mx-4 text-stone-500 text-xs uppercase">Или авторизация</span>
            <div className="flex-grow border-t border-stone-600"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-bold text-stone-400 mb-1">Имя Героя</label>
                <div className="relative">
                  <UserIcon className="absolute top-3 left-3 h-5 w-5 text-stone-500" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 bg-stone-900 border border-stone-700 rounded focus:ring-1 focus:ring-yellow-600 focus:border-yellow-600 text-amber-50 placeholder-stone-600"
                    placeholder="Артур"
                  />
                </div>
              </div>

              <div className="flex items-start bg-stone-900/50 p-3 rounded border border-stone-700">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => setHasConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 text-yellow-600 bg-stone-800 border-stone-600 rounded focus:ring-yellow-500"
                  />
                <label htmlFor="consent" className="ml-3 text-sm text-stone-400">
                  Клянусь, что мои родители знают о моем походе (Согласие).
                </label>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-stone-400 mb-1">Магическая Почта</label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-5 w-5 text-stone-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 bg-stone-900 border border-stone-700 rounded focus:ring-1 focus:ring-yellow-600 focus:border-yellow-600 text-amber-50 placeholder-stone-600"
                placeholder="hero@realm.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-400 mb-1">Тайный Шифр</label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-5 w-5 text-stone-500" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 bg-stone-900 border border-stone-700 rounded focus:ring-1 focus:ring-yellow-600 focus:border-yellow-600 text-amber-50 placeholder-stone-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-yellow-700 hover:bg-yellow-600 border border-yellow-500 rounded font-bold text-white shadow-md transition-colors"
          >
            {loading ? 'Загрузка маны...' : (isLogin ? 'Войти в мир' : 'Создать Легенду')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ email: '', password: '', username: '' });
            }}
            className="text-sm font-medium text-yellow-500 hover:text-yellow-400 underline decoration-dotted"
          >
            {isLogin ? 'Нет свитка? Напиши новый' : 'Уже есть свиток? Открыть'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showConsentModal}
        onRequestClose={() => setShowConsentModal(false)}
        className="max-w-md mx-auto mt-20 bg-stone-800 p-6 rounded-lg border-2 border-yellow-600 text-amber-50 outline-none"
        overlayClassName="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 rpg-font">Кодекс Чести</h3>
          <p className="text-stone-400 mb-6">
            Юные герои должны иметь разрешение старших для вступления в гильдию. Подтвердите это.
          </p>
          <button
            onClick={() => {
              setHasConsent(true);
              setShowConsentModal(false);
            }}
            className="bg-yellow-700 text-white px-6 py-2 rounded font-bold hover:bg-yellow-600 w-full"
          >
            Я подтверждаю
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Login;
