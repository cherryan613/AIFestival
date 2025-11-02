'use client';

import { useState, useEffect } from 'react';
import styles from '../../style/MiniGame.module.css';

const TEXT_DATA = [
  { id: 1, plaintext: 'jgnnqyqtnf', ciphertext: 'helloworld' },
  { id: 2, plaintext: 'vdxjggzbz', ciphertext: 'aicollege' },
  { id: 3, plaintext: 'xpatngboxklbmr', ciphertext: 'ewhauniversity' },
  { id: 4, plaintext: 'qmpsfgsqifwhm', ciphertext: 'cybersecurity' },
  { id: 5, plaintext: 'trvjri', ciphertext: 'caesar' },
];

const CSGame = ({ isOpen, onClose }) => {
  const [shift, setShift] = useState(1);
  const [result, setResult] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // 랜덤 문제 선택
  const selectRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * TEXT_DATA.length);
    setCurrentQuestion(TEXT_DATA[randomIndex]);
  };

  const caesarDecipher = (text, shiftValue) => {
    let result = "";
    for (let i = 0; i < text.length; i++) {
      let char = text[i];
      // 알파벳 소문자인 경우에만 처리
      if (char >= "a" && char <= "z") {
        let charCode = text.charCodeAt(i);
        // (charCode - 'a' - shift + 26) % 26 계산으로 음수 방지
        let shiftedCharCode = ((charCode - 97 - shiftValue + 26) % 26) + 97;
        result += String.fromCharCode(shiftedCharCode);
      } else {
        // 알파벳이 아니면 그대로 추가
        result += char;
      }
    }
    return result;
  };

  const updateResult = (newShift) => {
    if (!currentQuestion) return;
    const decryptedText = caesarDecipher(currentQuestion.plaintext, newShift);
    setResult(decryptedText);
  };

  const handleSliderChange = (e) => {
    const newShift = parseInt(e.target.value);
    setShift(newShift);
    updateResult(newShift);
    setSubmitted(false); // 슬라이더 변경 시 제출 상태 초기화
  };

  const handleSubmit = () => {
    const correct = result === currentQuestion.ciphertext;
    setSubmitted(true);
    setIsCorrect(correct);
    setShowResult(true);
  };

  // 돌아가기
  // 결과가 나오면 잠시 표시 후 자동 종료 (돌아가기 버튼 제거)
  useEffect(() => {
    if (showResult) {
      const t = setTimeout(() => onClose(!!isCorrect), 1000);
      return () => clearTimeout(t);
    }
  }, [showResult, isCorrect]);

  // 컴포넌트가 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      selectRandomQuestion();
      setShift(1);
      setResult('');
      setSubmitted(false);
      setIsCorrect(false);
      setShowResult(false);
    }
  }, [isOpen]);

  // currentQuestion이 변경될 때 결과 업데이트
  useEffect(() => {
    if (currentQuestion) {
      updateResult(shift);
    }
  }, [currentQuestion]);

  if (!isOpen) return null;

  // 문제가 아직 로드되지 않았을 때
  if (!currentQuestion) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.gameWindow}>
        <div className={styles.header}>
          <h2>시저 암호 해독기</h2>
          <button className={styles.closeButton} onClick={() => onClose(false)}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.cipherGame}>
            {/* 문제/조작 UI는 항상 표시 */}
            <div className={styles.gameSection}>
              <p className={styles.sectionTitle}>암호문</p>
              <div className={styles.cipherText}>
                {currentQuestion.plaintext}
              </div>
            </div>

            <div className={styles.gameSection}>
              <p className={styles.sectionTitle}>해독문</p>
              <div className={`${styles.resultText} ${submitted && isCorrect ? styles.correct : ''}`}>
                {result}
              </div>
            </div>

            <div className={styles.sliderContainer}>
              <label className={styles.sliderLabel}>밀기(Shift) 값</label>
              <input 
                type="range" 
                min="1" 
                max="26" 
                value={shift}
                onChange={handleSliderChange}
                className={styles.slider}
              />
              <div className={styles.shiftValue}>{shift}</div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {!showResult && (
                <button
                  onClick={handleSubmit}
                  disabled={submitted}
                  style={{
                    padding: '12px 40px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    border: 'none',
                    background: submitted ? '#ccc' : '#4CAF50',
                    color: '#fff',
                    cursor: submitted ? 'not-allowed' : 'pointer',
                    transition: 'background 0.3s'
                  }}
                  onMouseOver={(e) => !submitted && (e.target.style.background = '#45a049')}
                  onMouseOut={(e) => !submitted && (e.target.style.background = '#4CAF50')}
                >
                  제출
                </button>
              )}
            </div>

            {/* 결과 메시지 */}
            {showResult && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <div>
                  {!isCorrect && (
                    <div>
                      <p>오답! 시큐가 도망쳤습니다.</p>
                    </div>
                  )}
                  {isCorrect && (
                    <div>
                      <p>시큐 획득 완료!</p>
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

export default CSGame;