
import { audio } from '../services/audio';

export const useSoundEffects = () => {
  return {
    playCorrect: () => audio.playCorrect(),
    playWrong: () => audio.playWrong(),
    playLevelUp: () => audio.playLevelUp(),
    playCoins: () => audio.playCoins(),
    playQuestComplete: () => audio.playQuestComplete(),
  };
};
