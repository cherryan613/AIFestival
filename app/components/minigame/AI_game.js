'use client';

import { useState, useEffect } from 'react';
import styles from '../../style/MiniGame.module.css';

// 이미지 데이터 매칭 리스트
const IMAGE_DATA = [
  { id: 1, name: '이아이', mosaic: '/AI_game/이아이_모자이크.png' },
  { id: 2, name: '잉쥐', mosaic: '/AI_game/잉쥐_모자이크.png' },
  { id: 3, name: '데이리', mosaic: '/AI_game/데이리_모자이크.png' },
  { id: 4, name: '시큐', mosaic: '/AI_game/시큐_모자이크.png' },
  { id: 5, name: '코코모', mosaic: '/AI_game/코코모_모자이크.png' },
  { id: 6, name: '잉데쀼', mosaic: '/AI_game/잉데쀼_모자이크.png' },
];

const AIGame = ({ isOpen, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [choices, setChoices] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // 랜덤 문제 생성
  const generateQuestion = () => {
    setShowOriginal(false); // 처음엔 모자이크만 보여주기
    // 6개 중 랜덤으로 정답 선택
    const correctAnswer = IMAGE_DATA[Math.floor(Math.random() * IMAGE_DATA.length)];
    
    // 정답 외의 오답 2개 선택
    const wrongAnswers = IMAGE_DATA
      .filter(img => img.id !== correctAnswer.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    // 보기 3개 생성 (정답 + 오답 2개)
    const allChoices = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    setCurrentQuestion(correctAnswer);
    setChoices(allChoices);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowResult(false);
  };

  // 게임 시작 시 문제 생성
  useEffect(() => {
    if (isOpen) {
      generateQuestion();
    }
  }, [isOpen]);

  // 답 선택
  const handleSelectAnswer = (choice) => {
    if (showResult) return; // 이미 정답 확인한 경우 무시
    
    setSelectedAnswer(choice.id);
    const correct = choice.id === currentQuestion.id;
    setIsCorrect(correct);
    setShowResult(true);
    
    // 정답이면 원본 이미지 보여주기
    if (correct) {
      setShowOriginal(true);
    }

    // 결과 표시 후 자동 종료 (돌아가기 버튼 없이)
    setTimeout(() => {
      onClose(!!correct);
    }, 1000);
  };

  // 돌아가기
  const handleGoBack = () => {
    // 성공일 때만 획득 처리. 실패해도 맵으로는 돌아가되 보상은 없음
    onClose(!!isCorrect);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.gameWindow}>
        <div className={styles.header}>
          <h2>💫 • AI 이미지 맞히기</h2>
          <button className={styles.closeButton} onClick={() => onClose(false)}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          {currentQuestion && (
            <div className={styles.aiGameQuestion}>
              {/* 모자이크 이미지 */}
              <div className={styles.aiGameImageBox}>
                <img 
                  src={currentQuestion.mosaic} 
                  alt="모자이크 이미지" 
                  className={styles.aiGameMosaicImg}
                />
              </div>

              {/* 보기 3개 */}
              <div className={styles.aiGameChoices}>
                {choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleSelectAnswer(choice)}
                    disabled={showResult}
                    className={
                      styles.aiGameChoiceBtn +
                      (selectedAnswer === choice.id
                        ? isCorrect
                          ? ' ' + styles.aiGameChoiceBtn + ' ' + styles.selectedCorrect
                          : ' ' + styles.aiGameChoiceBtn + ' ' + styles.selectedWrong
                        : '')
                    }
                  >
                    {choice.name}
                  </button>
                ))}
              </div>

              {/* 결과 메시지 */}
              {showResult && (
                <div>
                  {!isCorrect && (
                    <div className={styles.aiGameCorrectMsg}>
                      <p> 오답! 잉쥐가 도망쳤습니다. </p>
                    </div>
                  )}
                  {isCorrect && (
                    <div className={styles.aiGameCorrectMsg}>
                      <p> 잉쥐 획득 완료! </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGame;