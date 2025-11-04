'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '../style/Opening.module.css';

const Opening = ({ onComplete }) => {
  const [currentScene, setCurrentScene] = useState(-1); // -1: 눈 깜빡임, 0~2: 장면
  const [isBlinking, setIsBlinking] = useState(true);
  const [isBlackout, setIsBlackout] = useState(false);
  const [showScene, setShowScene] = useState(false);
  const audioRef = useRef(null);

  // 컴포넌트 마운트 시 눈 깜빡임 효과 시작
  useEffect(() => {
    // 즉시 장면 0 설정 (배경으로)
    setCurrentScene(0);
    
    // 2초 후 눈 깜빡임 종료
    const timer = setTimeout(() => {
      setIsBlinking(false);
      setShowScene(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (currentScene === -1 || isBlackout) return; // 애니메이션 중에는 클릭 무시

    if (currentScene === 0) {
      // 장면 0 → 장면 1
      setShowScene(false);
      setTimeout(() => {
        setCurrentScene(1);
        setShowScene(true);
      }, 300);
    } else if (currentScene === 1) {
      // 장면 1 → 암전 → 장면 2
      setShowScene(false);
      setIsBlackout(true);
      
      // 암전 시작과 동시에 BGM 재생
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch(() => {});
      }

      // 3초 후 페이드아웃 시작
      setTimeout(() => {
        if (audioRef.current) {
          let volume = 1.0;
          const fadeOut = setInterval(() => {
            volume -= 0.05;
            if (volume <= 0) {
              clearInterval(fadeOut);
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            } else {
              audioRef.current.volume = volume;
            }
          }, 100);
        }
      }, 5000);

      // 5초 후 장면 2 표시
      setTimeout(() => {
        setIsBlackout(false);
        setCurrentScene(2);
        setShowScene(true);
      }, 7000);
    } else if (currentScene === 2) {
      // 장면 2 → 페이드 아웃 후 완료
      setShowScene(false);
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 500);
    }
  };

  return (
    <div className={styles.fullScreenContainer} onClick={handleClick}>
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
      
      {/* Opening 화면 영역 - 3:4 비율 */}
      <div className={styles.openingScreenSection}>
        <div className={styles.openingScreen}>
          {/* 눈 깜빡임 효과 */}
          {isBlinking && (
            <div className={styles.blinkOverlay}>
              <div className={styles.eyeContainer}>
                <div className={styles.eye}></div>
              </div>
            </div>
          )}

          {/* 암전 효과 - 암전 이미지 포함 */}
          {isBlackout && (
            <div className={styles.blackoutOverlay}>
              <div className={styles.blackoutImageContainer}>
                <Image 
                  src="/opening/오프닝_암전.png"
                  alt="Blackout Scene"
                  fill
                  className={styles.blackoutImage}
                  priority
                />
              </div>
            </div>
          )}

          {/* 장면 이미지 */}
          {currentScene >= 0 && !isBlackout && (
            <div className={`${styles.openingImageContainer} ${showScene ? styles.fadeIn : styles.fadeOut}`}>
              <Image 
                src={`/opening/오프닝_${currentScene}.png`}
                alt={`Opening Scene ${currentScene}`}
                fill
                className={styles.openingImage}
                priority
              />
            </div>
          )}
        </div>
      </div>

      {/* BGM 오디오 */}
      <audio ref={audioRef} src="/bgm/로켓단.mp3" />
    </div>
  );
};

export default Opening;