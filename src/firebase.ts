
// В локальной версии приложения Firebase отключен.
// Этот файл оставлен для совместимости импортов, но не выполняет сетевых запросов.

export const auth = {
  currentUser: null,
  signOut: async () => Promise.resolve(),
};

export const db = {};

// Заглушка для провайдера
export const googleProvider = {};

const app = {};
export default app;
