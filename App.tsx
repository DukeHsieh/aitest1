import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { AppState, Question, LeaderboardEntry } from './types';
import { generateQuizQuestions } from './services/gemini';
import { saveScore, getLeaderboard, resetLeaderboard } from './services/storage';
import { Loader2, Trophy, AlertCircle, CheckCircle, XCircle, RefreshCw, Play, BarChart3, ChevronRight, Settings } from 'lucide-react';

// --- Sub-components for cleaner App.tsx ---

// 1. Welcome Screen
const WelcomeScreen: React.FC<{ 
  onStart: (name: string) => void, 
  leaderboard: LeaderboardEntry[], 
  onResetLeaderboard: () => void 
}> = ({ onStart, leaderboard, onResetLeaderboard }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onStart(name.trim());
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">歡迎參加 AI 知識測驗</h2>
        <p className="text-slate-300">
          本測驗將隨機生成 20 道題目，涵蓋 AI 常識、工具應用及最新趨勢。
          請輸入您的大名以開始測驗。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto w-full">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
            姓名 / 職稱
          </label>
          <input
            type="text"
            id="name"
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Ex: 王經理"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
        >
          <Play size={18} />
          開始測驗
        </button>
      </form>

      {leaderboard.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="text-yellow-400" size={20} />
              榮譽榜 (Top 10)
            </h3>
            <button 
              onClick={onResetLeaderboard}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} /> 重置排名
            </button>
          </div>
          <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                <tr>
                  <th className="px-4 py-3">排名</th>
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3 text-right">分數</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 10).map((entry, idx) => (
                  <tr key={entry.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono text-slate-400">#{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{entry.name}</td>
                    <td className="px-4 py-3 text-right text-yellow-400 font-bold">{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. Quiz Screen
const QuizScreen: React.FC<{
  questions: Question[];
  onFinish: (score: number) => void;
}> = ({ questions, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQuestion.correctAnswerIndex) {
      setScore(prev => prev + (100 / questions.length)); // Simple scoring
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Score is already updated in handleOptionClick for the current question
      onFinish(Math.round(score));
    }
  };

  // Determine button styles based on state
  const getOptionStyle = (index: number) => {
    const baseStyle = "w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ";
    
    if (!isAnswered) {
      return baseStyle + "border-slate-600 hover:border-blue-500 hover:bg-slate-800 bg-slate-800/30 text-slate-200";
    }

    if (index === currentQuestion.correctAnswerIndex) {
      return baseStyle + "border-green-500 bg-green-500/10 text-green-100 ring-1 ring-green-500";
    }

    if (index === selectedOption && index !== currentQuestion.correctAnswerIndex) {
      return baseStyle + "border-red-500 bg-red-500/10 text-red-100";
    }

    return baseStyle + "border-slate-700 opacity-50 cursor-not-allowed";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5">
        <div 
          className="bg-blue-500 h-1.5 transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6 md:p-8 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6 text-slate-400 text-sm">
          <span>題目 {currentIndex + 1} / {questions.length}</span>
          <span>目前得分: {Math.round(score)}</span>
        </div>

        <h3 className="text-xl md:text-2xl font-semibold text-white mb-8 leading-relaxed">
          {currentQuestion.text}
        </h3>

        <div className="space-y-3 flex-1">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={isAnswered}
              className={getOptionStyle(idx)}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {isAnswered && idx === currentQuestion.correctAnswerIndex && (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                )}
                {isAnswered && idx === selectedOption && idx !== currentQuestion.correctAnswerIndex && (
                  <XCircle className="text-red-500 w-5 h-5" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Feedback & Next Button Area */}
        <div className="mt-8 min-h-[100px]">
          {isAnswered && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className={`p-4 rounded-lg mb-4 text-sm ${
                selectedOption === currentQuestion.correctAnswerIndex 
                ? 'bg-green-500/20 border border-green-500/30 text-green-200' 
                : 'bg-blue-500/20 border border-blue-500/30 text-blue-200' // Show explanation even if wrong, but neutral/informative
              }`}>
                <p className="font-semibold mb-1 flex items-center gap-2">
                  {selectedOption === currentQuestion.correctAnswerIndex ? '正確！' : '解析：'}
                </p>
                <p>{currentQuestion.explanation}</p>
              </div>
              <button
                onClick={handleNext}
                className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
              >
                {currentIndex === questions.length - 1 ? '查看結果' : '下一題'} <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. Loading Screen
const LoadingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
    <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-6" />
    <h3 className="text-xl font-semibold text-white mb-2">正在生成題目...</h3>
    <p className="text-slate-400 max-w-sm">
      AI 正在為您準備 20 道專屬測驗題，內容涵蓋常識、工具與最新趨勢。
    </p>
  </div>
);

// 4. Result Screen
const ResultScreen: React.FC<{
  score: number;
  leaderboard: LeaderboardEntry[];
  onRestart: () => void;
}> = ({ score, leaderboard, onRestart }) => {
  const isHighScore = leaderboard.some(l => l.score === score && Date.now() - l.timestamp < 1000); // Simple check if this is the just-added score

  return (
    <div className="p-8 text-center flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
        <span className="text-4xl font-bold text-white">{score}</span>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">測驗完成！</h2>
      <p className="text-slate-300 mb-8">
        {score >= 80 ? "太棒了！您是 AI 專家！" : 
         score >= 60 ? "不錯喔，掌握了基礎知識！" : 
         "再接再厲，AI 世界很大！"}
      </p>

      <div className="w-full bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
        <h3 className="text-left font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="text-blue-400" /> 最新排名
        </h3>
        <div className="space-y-3">
          {leaderboard.slice(0, 5).map((entry, idx) => (
            <div 
              key={entry.id} 
              className={`flex items-center justify-between p-3 rounded-lg ${
                isHighScore && entry.score === score ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-slate-700/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-yellow-500 text-yellow-950' :
                  idx === 1 ? 'bg-slate-300 text-slate-900' :
                  idx === 2 ? 'bg-amber-700 text-amber-100' :
                  'bg-slate-600 text-slate-300'
                }`}>
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-slate-200">{entry.name}</span>
              </div>
              <span className="font-mono text-blue-300 font-bold">{entry.score}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
      >
        <RefreshCw size={18} />
        返回首頁
      </button>
    </div>
  );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [userName, setUserName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial load of leaderboard
  useEffect(() => {
    setLeaderboard(getLeaderboard());
  }, []);

  const handleStart = async (name: string) => {
    setUserName(name);
    setAppState(AppState.LOADING);
    try {
      const q = await generateQuizQuestions(20);
      setQuestions(q);
      setAppState(AppState.QUIZ);
    } catch (e) {
      console.error(e);
      setErrorMsg("生成題目失敗。請確認網路連線，或檢查您的 API Key 是否正確設定。");
      setAppState(AppState.ERROR);
    }
  };

  const handleQuizFinish = (score: number) => {
    setCurrentScore(score);
    // Save score and update leaderboard
    const newLeaderboard = saveScore(userName, score);
    setLeaderboard(newLeaderboard);
    setAppState(AppState.RESULT);
  };

  const handleResetLeaderboard = () => {
    if (confirm("確定要重置所有排名紀錄嗎？")) {
      resetLeaderboard();
      setLeaderboard([]);
    }
  };

  const handleRestart = () => {
    setAppState(AppState.WELCOME);
    setUserName('');
    setCurrentScore(0);
  };

  return (
    <Layout>
      {appState === AppState.WELCOME && (
        <WelcomeScreen 
          onStart={handleStart} 
          leaderboard={leaderboard}
          onResetLeaderboard={handleResetLeaderboard}
        />
      )}
      
      {appState === AppState.LOADING && <LoadingScreen />}
      
      {appState === AppState.QUIZ && (
        <QuizScreen questions={questions} onFinish={handleQuizFinish} />
      )}
      
      {appState === AppState.RESULT && (
        <ResultScreen 
          score={currentScore} 
          leaderboard={leaderboard} 
          onRestart={handleRestart} 
        />
      )}

      {appState === AppState.ERROR && (
        <div className="p-8 text-center flex flex-col items-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">發生錯誤</h2>
          <p className="text-slate-300 mb-6 max-w-xs mx-auto">{errorMsg}</p>
          <div className="flex gap-3">
             <button 
              onClick={() => {
                if(userName) handleStart(userName);
                else setAppState(AppState.WELCOME);
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold flex items-center gap-2"
            >
              <RefreshCw size={16} /> 重試
            </button>
            <button 
              onClick={() => setAppState(AppState.WELCOME)}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
            >
              返回首頁
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;