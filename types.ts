export enum AppState {
  WELCOME = 'WELCOME',
  LOADING = 'LOADING',
  QUIZ = 'QUIZ',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  timestamp: number;
}

export interface QuizConfig {
  questionCount: number;
  topics: string[];
}