'use client';

import { useState } from 'react';
import Opening from './components/Opening';
import MainPage from './components/MainPage';
import Ending from './components/Ending';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState('opening'); // 'opening', 'main', 'ending'
  const [showMain, setShowMain] = useState(false);
  const [showEnding, setShowEnding] = useState(false);
  const [clearedGames, setClearedGames] = useState(new Set());
  
  const handleOpeningComplete = () => {
    // Opening 페이드 아웃 후 MainPage 페이드 인
    setCurrentScreen('transition');
    
    setTimeout(() => {
      setCurrentScreen('main');
      setShowMain(true);
    }, 500);
  };

  const handleGameComplete = () => {
    // 모든 게임 클리어 시 Ending으로 전환
    setCurrentScreen('transition');
    
    setTimeout(() => {
      setCurrentScreen('ending');
      setShowEnding(true);
    }, 500);
  };

  const handleRestart = () => {
    // 엔딩 후 다시 시작
    setCurrentScreen('opening');
    setShowMain(false);
    setShowEnding(false);
    setClearedGames(new Set());
  };

  return (
    <div className="w-full h-screen">
      {currentScreen === 'opening' && (
        <Opening onComplete={handleOpeningComplete} />
      )}
      {currentScreen === 'main' && (
        <div className={showMain ? 'fade-in' : ''}>
          <MainPage onGameComplete={handleGameComplete} />
        </div>
      )}
      {currentScreen === 'ending' && (
        <div className={showEnding ? 'fade-in' : ''}>
          <Ending onRestart={handleRestart} clearedGames={clearedGames} />
        </div>
      )}
      
      <style jsx>{`
        .fade-in {
          animation: fadeIn 1s ease-in forwards;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
