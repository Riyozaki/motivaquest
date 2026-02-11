import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, BossBattlePayload } from '../services/api';
import { RootState } from './index';
import { updateUserProfile, addExperience } from './userSlice';
import { CAMPAIGN_DATA } from './questsSlice';
import { toast } from 'react-toastify';
import { handleApiError } from './userSlice';

export const updateCampaignAction = createAsyncThunk(
    'campaign/updateCampaignAction',
    async (payload: { campaignId: string, currentDay: number, completedDays: number[] }, { getState }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;
        try {
            await api.updateCampaign(user.email, payload.campaignId, payload.currentDay, payload.completedDays);
        } catch (e) { handleApiError(e); }
    }
);

export const advanceCampaignDay = createAsyncThunk(
    'campaign/advanceCampaign',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email || !user.campaign.isDayComplete) return;

        // Prevent advancing past the final day (loop exploit fix)
        if (user.campaign.currentDay >= 14) {
            return;
        }

        const nextDay = user.campaign.currentDay + 1;
        const newAllies = [...user.campaign.unlockedAllies];
        
        let allyUnlocked = null;
        if (nextDay === 3) allyUnlocked = 'fairy';
        if (nextDay === 7) allyUnlocked = 'warrior';
        
        if (allyUnlocked && !newAllies.includes(allyUnlocked)) {
            newAllies.push(allyUnlocked);
            api.unlockAlly(user.email, allyUnlocked).catch(console.warn);
        }

        await dispatch(addExperience({ xp: 100, coins: 50 }));

        const updates = {
            campaign: {
                currentDay: nextDay > 14 ? 14 : nextDay, 
                isDayComplete: false,
                unlockedAllies: newAllies
            },
            lastCampaignAdvanceDate: new Date().toISOString() // LOCK the day
        };

        await dispatch(updateUserProfile(updates));
        // Sync Campaign
        await dispatch(updateCampaignAction({ 
            campaignId: 'main', 
            currentDay: nextDay > 14 ? 14 : nextDay, 
            completedDays: [] 
        }));

        toast.info("День завершен! Сюжет продолжается...", { icon: () => "📜" });
        return updates;
    }
);

export const finishCampaign = createAsyncThunk(
    'campaign/finishCampaign',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        await dispatch(addExperience({ xp: 5000, coins: 2000 }));
        
        try {
            await api.addAchievement(user.email, { id: 'legend_of_productivity', title: 'Legend of Productivity' });
        } catch (e) { handleApiError(e); }
        
        const updates = {
            achievements: [...user.achievements, 'legend_of_productivity'],
            campaign: { ...user.campaign, isDayComplete: true }
        };
        
        return updates;
    }
);

export const completeBossBattleAction = createAsyncThunk(
    'campaign/completeBossBattle',
    async (payload: BossBattlePayload, { getState, dispatch }) => {
        const state = getState() as RootState;
        const user = state.user.currentUser;
        if (!user || !user.email) return;

        // Optimistic
        if (payload.won) {
            await dispatch(addExperience({ xp: payload.xpEarned, coins: payload.coinsEarned }));
        }

        try {
            await api.completeBossBattle(payload);
        } catch (e) { handleApiError(e); }
    }
);

const campaignSlice = createSlice({
  name: 'campaign',
  initialState: {},
  reducers: {},
});

export default campaignSlice.reducer;