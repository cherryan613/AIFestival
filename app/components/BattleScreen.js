'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '../style/BattleScreen.module.css';
import CSGame from './minigame/CS_game';
import DSGame from './minigame/DS_game';
import CSEGame from './minigame/CSE_game';
import AIGame from './minigame/AI_game';
import AIDSGame from './minigame/AIDS_game';

// battleType: 1=AI, 2=DS, 3=CS, 4=CSE, 5=AIDS
const BattleScreen = ({ clearedGames, setClearedGames, onBack, onOpenDex, battleType = 1, onCleared }) => {
  const [currentMiniGame, setCurrentMiniGame] = useState(null);
  const audioRef = useRef(null);

  // 배틀 BGM: 배틀 화면에 진입하면 재생, 이 화면을 벗어나면 정지
  useEffect(() => {
    const audio = new Audio('/bgm/battle.mp3');
    audio.loop = true; // 무한 재생
    audio.volume = 1.0;
    audioRef.current = audio;

    const tryPlay = () => {
      try {
        const p = audio.play();
        if (p && typeof p.then === 'function') {
          p.catch(() => {});
        }
      } catch {}
    };
    tryPlay();

    // 사용자 입력 시 자동 재시도
    const resumeOnUserGesture = () => tryPlay();
    window.addEventListener('pointerdown', resumeOnUserGesture, { once: true });
    window.addEventListener('touchstart', resumeOnUserGesture, { once: true });
    window.addEventListener('keydown', resumeOnUserGesture, { once: true });

    return () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
      audioRef.current = null;
      window.removeEventListener('pointerdown', resumeOnUserGesture);
      window.removeEventListener('touchstart', resumeOnUserGesture);
      window.removeEventListener('keydown', resumeOnUserGesture);
    };
  }, []);

  // 전투 시작 (미니게임 실행)
  const handleBattle = () => {
    // 해당 배틀타입의 게임만 실행
    if (!clearedGames.has(battleType)) {
      setCurrentMiniGame(battleType);
    } else {
      alert('이미 클리어한 게임입니다!');
    }
  };

  // 미니게임 닫기
  const closeMiniGame = (isCleared = false) => {
    if (isCleared && currentMiniGame) {
      setClearedGames(prev => new Set([...prev, currentMiniGame]));
      if (onCleared) {
        onCleared();
      }
    }
    // 결과와 관계없이 미니게임을 닫고 맵으로 복귀
    setCurrentMiniGame(null);
    onBack();
  };

  return (
    <div className={styles.battleContainer}>
      {/* 상단 로고 */}
      <div className={styles.logoSection}>
        <Image 
          src="/Logo.png" 
          alt="AI Festival Logo" 
          width={140}
          height={70}
          className={styles.logoImage}
        />
      </div>

      {/* 전투 화면 - 더 큰 크기로 조정 */}
      <div className={styles.battleScreenSection}>
        <div className={styles.battleScreen}>
          <Image 
            src={
              battleType === 1 ? "/battle_map/전투폼_잉쥐.png" :
              battleType === 2 ? "/battle_map/전투폼_데이리.png" :
              battleType === 3 ? "/battle_map/전투폼_시큐.png" :
              battleType === 4 ? "/battle_map/전투폼_코코모.png" :
              battleType === 5 ? "/battle_map/전투폼_잉데쀼.png" :
              "/Map2.png"
            }
            alt="Battle Map" 
            width={800}
            height={600}
            className={styles.battleMapImage}
            priority
          />
        </div>
      </div>

      {/* 하단 컨트롤 - 큰 크기 */}
      <div className={styles.battleControlSection}>
        <div className={styles.battleControls}>
          {/* 중앙의 큰 싸운다 버튼 */}
          <div className={styles.battleMainButton}>
            <button 
              className={styles.battleMainBtn}
              onClick={handleBattle}
            >
              싸운다
            </button>
          </div>
          
          {/* 하단의 3개 버튼 */}
          <div className={styles.battleSubButtons}>
            <button 
              className={styles.battleSubBtn}
              onClick={() => alert('공략 방법을 확인합니다!')}
            >
              공략 방법
            </button>
            <button 
              className={styles.battleSubBtn}
              onClick={onBack}
            >
              도망간다
            </button>
          </div>
        </div>
      </div>

      {/* 미니게임 창들 */}
      <AIGame isOpen={currentMiniGame === 1} onClose={closeMiniGame} />
      <DSGame isOpen={currentMiniGame === 2} onClose={closeMiniGame} />
      <CSGame isOpen={currentMiniGame === 3} onClose={closeMiniGame} />
      <CSEGame isOpen={currentMiniGame === 4} onClose={closeMiniGame} />
      <AIDSGame isOpen={currentMiniGame === 5} onClose={closeMiniGame} />
    </div>
  );
};

export default BattleScreen;