'use client';

import { useState } from 'react';
import Opening from './components/Opening';
import MainPage from './components/MainPage';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState('opening'); // 'opening' or 'main'
  const [showMain, setShowMain] = useState(false);
  
  const handleOpeningComplete = () => {
    // Opening 페이드 아웃 후 MainPage 페이드 인
    setCurrentScreen('transition');
    
    setTimeout(() => {
      setCurrentScreen('main');
      setShowMain(true);
    }, 500);
  };

  return (
    <div className="w-full h-screen">
      {currentScreen === 'opening' && (
        <Opening onComplete={handleOpeningComplete} />
      )}
      {currentScreen === 'main' && (
        <div className={showMain ? 'fade-in' : ''}>
          <MainPage />
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
