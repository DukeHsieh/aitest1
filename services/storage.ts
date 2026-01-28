import { LeaderboardEntry } from '../types';

const STORAGE_KEY = 'ai_quiz_leaderboard';

export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load leaderboard", e);
    return [];
  }
};

export const saveScore = (name: string, score: number): LeaderboardEntry[] => {
  const current = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    id: crypto.randomUUID(),
    name,
    score,
    timestamp: Date.now(),
  };
  
  const updated = [...current, newEntry]
    .sort((a, b) => b.score - a.score) // Sort descending by score
    .slice(0, 100); // Keep top 100
    
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const resetLeaderboard = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};