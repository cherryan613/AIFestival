'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from '../style/Ending.module.css';

const Ending = ({ onRestart, clearedGames }) => {
  const [currentScene, setCurrentScene] = useState(0); // 0: 엔딩1, 1: 엔딩2, 2: 버튼, 3: 도감
  const [showScene, setShowScene] = useState(true);
  const [showDex, setShowDex] = useState(false);

  const handleClick = () => {
    if (currentScene === 0) {
      // 엔딩 1 → 엔딩 2
      setShowScene(false);
      setTimeout(() => {
        setCurrentScene(1);
        setShowScene(true);
      }, 300);
    } else if (currentScene === 1) {
      // 엔딩 2 → 버튼 화면
      setShowScene(false);
      setTimeout(() => {
        setCurrentScene(2);
        setShowScene(true);
      }, 300);
    }
  };

  const handleShowDex = () => {
    setShowDex(true);
  };

  const handleCloseDex = () => {
    setShowDex(false);
    if (onRestart) {
      onRestart();
    }
  };

  return (
    <div className={styles.fullScreenContainer} onClick={currentScene < 2 ? handleClick : undefined}>
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
      
      {/* Ending 화면 영역 */}
      <div className={styles.endingScreenSection}>
        <div className={styles.endingScreen}>
          {/* 엔딩 이미지 */}
          {currentScene < 2 && (
            <div className={`${styles.endingImageContainer} ${showScene ? styles.fadeIn : styles.fadeOut}`}>
              <Image 
                src={`/ending/엔딩_${currentScene + 1}.png`}
                alt={`Ending Scene ${currentScene + 1}`}
                fill
                className={styles.endingImage}
                priority
              />
            </div>
          )}

          {/* 버튼 화면 */}
          {currentScene === 2 && !showDex && (
            <div className={`${styles.endingButtonContainer} ${showScene ? styles.fadeIn : ''}`}>
              <h2 className={styles.endingTitle}>축하합니다!</h2>
              <p className={styles.endingSubtitle}>모든 포켓몬을 수집하였습니다.</p>
              <button className={styles.dexButton} onClick={handleShowDex}>
                도감 확인하기
              </button>
            </div>
          )}

          {/* 도감 화면 */}
          {showDex && (
            <div className={styles.finalDexContainer}>
              <div className={styles.dexHeader}>
                <h3>완성된 도감</h3>
              </div>
              <div className={styles.dexGrid}>
                {/* 인공지능전공 */}
                <div className={styles.dexCard}>
                  <div className={styles.cardContent}>
                    <img
                      src="/charactor/잉쥐.png"
                      alt="AI Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>잉쥐</div>
                  </div>
                </div>
                
                {/* 데이터사이언스전공 */}
                <div className={styles.dexCard}>
                  <div className={styles.cardContent}>
                    <img
                      src="/charactor/데이리.png"
                      alt="DS Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>데이리</div>
                  </div>
                </div>

                {/* 사이버보안학과 */}
                <div className={styles.dexCard}>
                  <div className={styles.cardContent}>
                    <img
                      src="/charactor/시큐.png"
                      alt="CS Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>시큐</div>
                  </div>
                </div>
                
                {/* 컴퓨터공학과 */}
                <div className={styles.dexCard}>
                  <div className={styles.cardContent}>
                    <img
                      src="/charactor/코코모.png"
                      alt="CSE Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>코코모</div>
                  </div>
                </div>
                
                {/* 인공지능데이터사이언스학부 */}
                <div className={styles.dexCard}>
                  <div className={styles.cardContent}>
                    <img
                      src="/charactor/잉데쀼.png"
                      alt="AIDS Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>잉데쀼</div>
                  </div>
                </div>

                {/* 이아이 */}
                <div className={styles.dexCard}>
                  <div className={styles.cardContent}>
                    <img
                      src="/charactor/이아이.png"
                      alt="E-AI Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>이아이</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 흰색 박스 밖, 아래에 추가할 내용 - 여기에 글씨나 버튼 추가 가능 */}
      {showDex && (
        <div className={styles.belowBoxContent}>
          <p>이 장면을 캡쳐하여 보관해주세요!</p>   
          <p>도장판 이벤트에 사용됩니다.</p>
          <button className={styles.dexButton} onClick={onRestart}>
            다시 시작
          </button>
        </div>
      )}
    </div>
  );
};

export default Ending;