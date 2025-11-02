'use client';

import { useState } from 'react';
import MainPage from './components/MainPage';
export default function Home() {
  const [currentScreen, setCurrentScreen] = useState('main'); // 'main' or 'game'
  
  const handleEnterGame = () => {
    setCurrentScreen('game');
  };

  return (
    <div className="w-full h-screen">
      {currentScreen === 'main' && (
        <MainPage onEnterGame={handleEnterGame} />
      )}
    </div>
  );
}
