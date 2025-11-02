'use client';

import { useState, useEffect } from 'react';
import styles from '../../style/MiniGame.module.css';

const AIDSGame = ({ isOpen, onClose }) => {
  const [attempts, setAttempts] = useState(5);
  const [ladderOpacity, setLadderOpacity] = useState(100);
  const [gameResult, setGameResult] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswer] = useState(Math.floor(Math.random() * 3)); // 0: 인지, 1: 데사, 2: 인데부

  const choices = ['인지', '데사', '인데부'];
  const results = ['AIDS 예방법', 'AIDS 치료법', 'AIDS 상식'];

  const resetGame = () => {
    setAttempts(5);
    setLadderOpacity(100);
    setGameResult(null);
    setSelectedChoice(null);
    setShowResult(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetGame();
    }
  }, [isOpen]);

  // 성공/실패 결정 시 자동 종료로 전환 (돌아가기 버튼 없이)
  useEffect(() => {
    if (gameResult === 'success') {
      const t = setTimeout(() => onClose(true), 1000);
      return () => clearTimeout(t);
    }
    if (gameResult === 'failed') {
      const t = setTimeout(() => onClose(false), 1000);
      return () => clearTimeout(t);
    }
  }, [gameResult]);

  const handleChoiceClick = (choiceIndex) => {
    if (attempts <= 0 || gameResult) return;

    setSelectedChoice(choiceIndex);
    setShowResult(true);

    if (choiceIndex === correctAnswer) {
      setGameResult('success');
    } else {
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      
      if (newAttempts > 0) {
        // 틀렸을 때 사다리 투명도 10% 감소
        setLadderOpacity(prev => Math.max(0, prev - 10));
        setTimeout(() => {
          setShowResult(false);
          setSelectedChoice(null);
        }, 2000);
      } else {
        setGameResult('failed');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.gameWindow}>
        <div className={styles.header}>
          <h2>AIDS 사다리타기 게임</h2>
          <button className={styles.closeButton} onClick={() => onClose(false)}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.gameInfo}>
            <p>남은 기회: {attempts}번</p>
            <p>올바른 선택지를 골라보세요!</p>
          </div>

          <div className={styles.ladderGame}>
            {/* 선택지 */}
            <div className={styles.choices}>
              {choices.map((choice, index) => (
                <button
                  key={index}
                  className={`${styles.choiceButton} ${
                    selectedChoice === index ? styles.selected : ''
                  }`}
                  onClick={() => handleChoiceClick(index)}
                  disabled={attempts <= 0 || gameResult}
                >
                  {choice}
                </button>
              ))}
            </div>

            {/* 사다리 (투명도 조절) */}
            <div className={styles.ladder}>
              <div 
                className={styles.ladderLines}
                style={{ opacity: ladderOpacity / 100 }}
              >
                <div className={styles.verticalLine}></div>
                <div className={styles.verticalLine}></div>
                <div className={styles.verticalLine}></div>
                <div className={styles.horizontalLine} style={{ top: '20%', left: '0%', width: '50%' }}></div>
                <div className={styles.horizontalLine} style={{ top: '40%', left: '50%', width: '50%' }}></div>
                <div className={styles.horizontalLine} style={{ top: '60%', left: '0%', width: '50%' }}></div>
                <div className={styles.horizontalLine} style={{ top: '80%', left: '50%', width: '50%' }}></div>
              </div>
            </div>

            {/* 결과 */}
            <div className={styles.results}>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`${styles.resultBox} ${
                    showResult && selectedChoice !== null && index === correctAnswer 
                      ? styles.correctResult 
                      : showResult && selectedChoice === index && index !== correctAnswer
                      ? styles.wrongResult
                      : ''
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>

          {/* 게임 결과 메시지 */}
          {gameResult === 'success' && (
            <div className={styles.gameMessage}>
              <h3>🎉 정답입니다!</h3>
              <p>AIDS에 대한 올바른 정보를 얻었습니다!</p>
              {/* 자동으로 닫힘 */}
            </div>
          )}

          {gameResult === 'failed' && (
            <div className={styles.gameMessage}>
              <h3>😅 기회를 모두 사용했습니다!</h3>
              <p>정답은 &ldquo;{choices[correctAnswer]}&rdquo;였습니다.</p>
              {/* 자동으로 닫힘 */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDSGame;