import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import questsReducer from './questsSlice';
import rewardsReducer from './rewardsSlice';
import socialReducer from './socialSlice';
import adminReducer from './adminSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    quests: questsReducer,
    rewards: rewardsReducer,
    social: socialReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;