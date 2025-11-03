'use client';

import { useState, useEffect } from 'react';
import styles from '../../style/MiniGame.module.css';

const AIDSGame = ({ isOpen, onClose }) => {
  const [attempts, setAttempts] = useState(5);
  const [isCorrect, setIsCorrect] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const choices = ['A', 'B', 'C'];
  const [results, setResults] = useState([]);
  const [mapping, setMapping] = useState([0, 1, 2]); // 사다리타기 매핑

  useEffect(() => {
    const arr = ['인데부', '인지', '데사'];
    const shuffled = arr.sort(() => Math.random() - 0.5);
    setResults(shuffled);
    // 사다리타기 매핑: [0,1,2]을 랜덤하게 섞음
    const ladder = [0, 1, 2].sort(() => Math.random() - 0.5);
    setMapping(ladder);
  }, [isOpen]);

  const resetGame = () => {
    setAttempts(5);
    setIsCorrect(null);
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
    if (isCorrect === true) {
      const t = setTimeout(() => onClose(true), 1000);
      return () => clearTimeout(t);
    }
    if (isCorrect === false) {
      const t = setTimeout(() => onClose(false), 1000);
      return () => clearTimeout(t);
    }
  }, [isCorrect]);

  const handleChoiceClick = (choiceIndex) => {
    if (attempts <= 0 || isCorrect) return;

    setSelectedChoice(choiceIndex);
    setShowResult(true);

    // 사다리타기 매핑에 따라 결과 결정
    const resultIdx = mapping[choiceIndex];
    if (results[resultIdx] === '인데부') {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
      setTimeout(() => {
        setShowResult(false);
        onClose(false);
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.gameWindow}>
        <div className={styles.header}>
          <h3>사다리타기 게임</h3>
          <button className={styles.closeButton} onClick={() => onClose(false)}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.ladderGame}>
            {/* 선택지 */}
            <div className={styles.choices}>
              {choices.map((choice, index) => (
                <button
                  key={index}
                  className={`${styles.choiceButton} ${selectedChoice === index ? styles.selected : ''}`}
                  onClick={() => handleChoiceClick(index)}
                  disabled={attempts <= 0 || isCorrect}
                >
                  {choice}
                </button>
              ))}
            </div>

            {/* 가운데 네모 칸 */}
            <div
              style={{
                width: '100%',
                height: '150px',
                background: '#e0f2fe',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '40px', color: '#0c4a6e', fontWeight: 'bold' }}>?</span>
            </div>

            {/* 결과 */}
            <div className={styles.results}>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`${styles.resultBox} ${
                    showResult && selectedChoice !== null && mapping[selectedChoice] === index && result === '인데부'
                      ? styles.correctResult
                      : showResult && selectedChoice !== null && mapping[selectedChoice] === index && result !== '인데부'
                      ? styles.wrongResult
                      : ''
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>

          {/* 결과 메시지 */}
          {showResult && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <div>
                {!isCorrect && (
                  <div>
                    <p>오답! 잉데쀼가 도망쳤습니다. </p>
                  </div>
                )}
                {isCorrect && (
                  <div>
                    <p>잉데쀼 획득 완료!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDSGame;