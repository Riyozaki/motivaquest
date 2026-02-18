import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { advanceCampaignDay } from '../store/campaignSlice';
import { fetchQuests } from '../store/questsSlice';
import { CAMPAIGN_DATA } from '../store/questsSlice';
import QuestModal from '../components/QuestModal';
import BossBattleModal from '../components/BossBattleModal';
import { Quest } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, Map as MapIcon } from 'lucide-react';
import LandingPage from '../components/LandingPage';
import DashboardView from '../components/dashboard/DashboardView';
import CampaignView from '../components/dashboard/CampaignView';

const HomeSkeleton = () => (
    <div className="animate-pulse space-y-8 max-w-7xl mx-auto w-full">
        {/* Hero */}
        <div className="h-64 bg-slate-800/40 rounded-3xl w-full border border-slate-700/30 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
        </div>
        
        {/* Mood */}
        <div className="h-32 bg-slate-800/40 rounded-3xl w-full border border-slate-700/30"></div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-slate-800/40 rounded-2xl border border-slate-700/30 p-6 space-y-4">
                    <div className="h-6 w-1/3 bg-slate-700/50 rounded"></div>
                    <div className="h-4 w-2/3 bg-slate-700/40 rounded"></div>
                    <div className="space-y-3 mt-6">
                        {[1, 2, 3].map(j => (
                             <div key={j} className="h-20 bg-slate-700/20 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const StoryDashboard: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { list: quests, status } = useSelector((state: RootState) => state.quests);
  const shopItems = useSelector((state: RootState) => state.rewards.shopItems);
  
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [questMultiplier, setQuestMultiplier] = useState(1);
  const [isBossModalOpen, setIsBossModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'campaign'>('dashboard');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchQuests());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
      return (
        <div className="relative pb-20">
             <div className="flex justify-center mb-8">
                  <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-1 flex gap-1 border border-slate-700/50 shadow-xl opacity-80 pointer-events-none">
                      <div className="px-6 py-2 rounded-xl bg-slate-800 text-slate-500 flex items-center gap-2"><HomeIcon size={16} /></div>
                      <div className="px-6 py-2 rounded-xl text-slate-600 flex items-center gap-2"><MapIcon size={16} /></div>
                  </div>
              </div>
            <HomeSkeleton />
        </div>
      );
  }

  if (!user) return null;

  const currentDayNum = user.campaign?.currentDay || 1;
  const currentStory = CAMPAIGN_DATA.find(d => d.day === currentDayNum) || CAMPAIGN_DATA[0];
  const storyQuests = quests.filter(q => currentStory.questIds.includes(q.id));
  const completedCount = storyQuests.filter(q => q.completed).length;
  const totalCount = storyQuests.length;

  const handleQuestOpen = (quest: Quest, isBoosted = false) => {
      setQuestMultiplier(isBoosted ? 1.5 : 1);
      setSelectedQuest(quest);
  };

  return (
    <div className="relative pb-20">
      
      {/* Top Navigation Tabs */}
      <div className="flex justify-center mb-8">
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-1 flex gap-1 border border-slate-700/50 shadow-xl">
              <button 
                onClick={() => setViewMode('dashboard')}
                className={`px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${viewMode === 'dashboard' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  <HomeIcon size={16} /> Штаб
              </button>
              <button 
                onClick={() => setViewMode('campaign')}
                className={`px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${viewMode === 'campaign' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  <MapIcon size={16} /> Кампания
              </button>
          </div>
      </div>

      <AnimatePresence mode="wait">
          {viewMode === 'dashboard' ? (
              <motion.div key="dashboard" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                  <DashboardView 
                    user={user} 
                    quests={quests} 
                    shopItems={shopItems} 
                    onQuestSelect={handleQuestOpen}
                  />
              </motion.div>
          ) : (
              <motion.div key="campaign" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <CampaignView 
                    currentDayNum={currentDayNum}
                    currentStory={currentStory}
                    storyQuests={storyQuests}
                    completedCount={completedCount}
                    totalCount={totalCount}
                    onQuestSelect={(q) => handleQuestOpen(q)}
                    onBossOpen={() => setIsBossModalOpen(true)}
                    onAdvanceDay={() => dispatch(advanceCampaignDay())}
                    isDayComplete={user.campaign?.isDayComplete}
                    user={user}
                  />
              </motion.div>
          )}
      </AnimatePresence>

      {/* Modals */}
      {selectedQuest && (
        <QuestModal 
            quest={selectedQuest} 
            isOpen={!!selectedQuest} 
            onClose={() => setSelectedQuest(null)} 
            multiplier={questMultiplier}
        />
      )}
      <BossBattleModal 
        isOpen={isBossModalOpen} 
        onClose={() => setIsBossModalOpen(false)} 
        allies={user.campaign.unlockedAllies || []} 
      />
    </div>
  );
};

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <StoryDashboard /> : <LandingPage />;
};

export default Home;