'use client';

import { useState, useEffect } from 'react';
import styles from '../../style/MiniGame.module.css';

const DSGame = ({ isOpen, onClose }) => {
  const [gameGrid, setGameGrid] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [clickedPositions, setClickedPositions] = useState(new Set());
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameActive, setIsGameActive] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  const normalText = "데사";
  const wrongText = "대사";
  const gridSize = 6; // 6x6 그리드
  
  // 게임 그리드 생성
  const generateGrid = () => {
    const grid = [];
    const wrongPosition = Math.floor(Math.random() * (gridSize * gridSize));
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      grid.push({
        id: i,
        text: i === wrongPosition ? wrongText : normalText,
        isWrong: i === wrongPosition,
        isClicked: false
      });
    }
    
    return grid;
  };
  
  // 셀 클릭 처리
  const handleCellClick = (cellId) => {
    if (isCorrect || isGameOver || !isGameActive) return;
    
    const cell = gameGrid.find(c => c.id === cellId);
    if (!cell || clickedPositions.has(cellId)) return;
    
    const newClickedPositions = new Set(clickedPositions);
    newClickedPositions.add(cellId);
    setClickedPositions(newClickedPositions);
    
    if (cell.isWrong) {
      setIsCorrect(true);
      setIsGameActive(false);
      setShowResult(true);
    } else {
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      
      if (newWrongAttempts >= 3) {
        setIsGameOver(true);
        setIsGameActive(false);
        setShowResult(true);
      }
    }
  };
  
  // 게임 리셋
  const resetGame = () => {
    setGameGrid(generateGrid());
    setIsCorrect(false);
    setIsGameOver(false);
    setClickedPositions(new Set());
    setWrongAttempts(0);
    setTimeLeft(30);
    setIsGameActive(true);
    setShowResult(false);
  };
  
  // 타이머 효과
  useEffect(() => {
    let timer;
    if (isGameActive && timeLeft > 0 && !isCorrect) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isGameActive) {
      setIsGameOver(true);
      setIsGameActive(false);
      setShowResult(true);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft, isGameActive, isCorrect]);
  
  // 컴포넌트가 열릴 때 게임 초기화
  useEffect(() => {
    if (isOpen) {
      resetGame();
    }
  }, [isOpen]);

  // 결과가 나오면 잠시 표시 후 자동 종료
  useEffect(() => {
    if (showResult && (isCorrect || isGameOver)) {
      const t = setTimeout(() => onClose(!!isCorrect), 1000);
      return () => clearTimeout(t);
    }
  }, [showResult, isCorrect, isGameOver]);
  
  if (!isOpen) return null;

  // 돌아가기 버튼 제거: 자동 종료로 대체

  return (
    <div className={styles.overlay}>
      <div className={styles.gameWindow}>
        <div className={styles.header}>
          <h2>👀 • 틀린 글자 찾기</h2>
          <button className={styles.closeButton} onClick={() => onClose(false)}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.spotGame}>
            
            <div className={styles.gameStatus}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>시간</span>
                <span className={`${styles.statusValue} ${timeLeft <= 10 ? styles.warning : ''}`}>
                  {timeLeft}초
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>실패</span>
                <span className={`${styles.statusValue} ${wrongAttempts >= 2 ? styles.danger : ''}`}>
                  {wrongAttempts}/3
                </span>
              </div>
            </div>
            
            <div className={styles.gameGrid}>
              {gameGrid.map((cell) => (
                <div
                  key={cell.id}
                  className={`${styles.gridCell} ${
                    clickedPositions.has(cell.id) 
                      ? cell.isWrong 
                        ? styles.correctCell 
                        : styles.wrongCell
                      : ''
                  }`}
                  onClick={() => handleCellClick(cell.id)}
                >
                  {cell.text}
                </div>
              ))}
            </div>
            
            {/* 결과 메시지 */}
            {showResult && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <div>
                  {!isCorrect && (
                    <div>
                      <p>오답! 데이리가 도망쳤습니다.</p>
                    </div>
                  )}
                  {isCorrect && (
                    <div>
                      <p>데이리 획득 완료!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSGame;