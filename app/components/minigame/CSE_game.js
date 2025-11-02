'use client';
import { useState, useEffect, useRef, useMemo } from 'react';

import styles from '../../style/MiniGame.module.css';

// 모달형 구조, isOpen/ onClose props 지원, css 모듈 적용
const CSEGame = ({ isOpen, onClose }) => {
  const colors = ["#ff2d55", "#ffd60a", "#0a84ff", "#bf5af2"];
  const height = 420;
  const width = 520;
  const padding = 24;
  const leftX = 48;
  const rightX = width - 48;
  const railInset = 18;
  const socketRadius = 10;
  const wireWidth = 10;
  const rowGap = (height - padding * 2) / (colors.length - 1);
  const HIT_EPS = socketRadius + 14; // 터치 드롭 관용 반경

  const [rightOrder, setRightOrder] = useState(() => shuffle([...colors.keys()]));
  const [connections, setConnections] = useState(new Map());
  const [drag, setDrag] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const svgRef = useRef(null);

  const leftSockets = useMemo(
    () => colors.map((c, i) => ({ side: "left", idx: i, x: leftX, y: padding + i * rowGap, color: c })),
    [colors, leftX, padding, rowGap]
  );
  const rightSockets = useMemo(
    () => rightOrder.map((i, pos) => ({ side: "right", idx: i, x: rightX, y: padding + pos * rowGap, color: colors[i] })),
    [colors, rightOrder, rightX, padding, rowGap]
  );

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getPointerPos(evt) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    // Support mouse, touch, and pointer events
    let clientX = 0;
    let clientY = 0;
    if (evt.touches && evt.touches.length > 0) {
      clientX = evt.touches[0].clientX;
      clientY = evt.touches[0].clientY;
    } else if (evt.changedTouches && evt.changedTouches.length > 0) {
      clientX = evt.changedTouches[0].clientX;
      clientY = evt.changedTouches[0].clientY;
    } else if (typeof evt.clientX === 'number' && typeof evt.clientY === 'number') {
      clientX = evt.clientX;
      clientY = evt.clientY;
    }
    pt.x = clientX; pt.y = clientY;
    const screenCTM = svg.getScreenCTM();
    const local = screenCTM ? pt.matrixTransform(screenCTM.inverse()) : pt;
    return { x: local.x, y: local.y };
  }

  const usedRight = useMemo(() => new Set([...connections.values()]), [connections]);

  const handleStart = (socket) => (e) => {
    e.preventDefault();
    const pos = getPointerPos(e);
    setDrag({ from: socket, pos });
  };
  const handleMove = (e) => {
    if (!drag) return;
    if (e && typeof e.preventDefault === 'function') {
      // Prevent page scroll during touch drag
      e.preventDefault();
    }
    setDrag((d) => ({ ...d, pos: getPointerPos(e) }));
  };
  const tryConnect = (fromSocket, toSocket) => {
    if (!toSocket) return;
    if (fromSocket.side === toSocket.side) return;
    const left = fromSocket.side === "left" ? fromSocket : toSocket;
    const right = fromSocket.side === "right" ? fromSocket : toSocket;
    if (usedRight.has(right.idx)) return;
    setConnections((old) => new Map(old).set(left.idx, right.idx));
  };
  const handleEnd = () => setDrag(null);
  // 터치/마우스 드래그 종료 시, 드롭 위치의 소켓을 판별해 연결 시도
  const handleEndWithHitTest = (e) => {
    if (!drag) return setDrag(null);
    const pos = e ? getPointerPos(e) : drag.pos;
    const opposite = drag.from.side === 'left' ? 'right' : 'left';
    const sockets = opposite === 'left' ? leftSockets : rightSockets;
    // 가장 가까운 소켓을 찾되, HIT_EPS 이내만 유효
    let best = null;
    let bestD2 = Infinity;
    for (const s of sockets) {
      const dx = s.x - pos.x;
      const dy = s.y - pos.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestD2) { bestD2 = d2; best = s; }
    }
    if (best && Math.sqrt(bestD2) <= HIT_EPS) {
      tryConnect(drag.from, best);
    }
    setDrag(null);
  };
  const handleDropOn = (socket) => (e) => {
    e.preventDefault();
    if (!drag) return;
    tryConnect(drag.from, socket);
    setDrag(null);
  };

  useEffect(() => {
    setConnections((m) => new Map([...m]));
  }, [rightOrder]);

  // 연결이 바뀌면 제출 상태 초기화
  useEffect(() => {
    setIsSubmitted(false);
    setIsCorrect(null);
    setShowResult(false);
  }, [connections]);

  const handleSubmit = () => {
    const complete = connections.size === colors.length;
    const correct = complete && [...connections].every(([l, r]) => l === r);
    setIsSubmitted(true);
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleReset = () => {
    setDrag(null);
    setConnections(new Map());
    setIsSubmitted(false);
    setIsCorrect(null);
    setShowResult(false);
  };

  // 결과가 나오면 잠시 표시 후 자동 종료
  useEffect(() => {
    if (showResult) {
      const t = setTimeout(() => onClose(!!isCorrect), 1000);
      return () => clearTimeout(t);
    }
  }, [showResult, isCorrect]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.gameWindow}>
        <div className={styles.header}>
          <h2>회로 연결하기</h2>
          <button className={styles.closeButton} onClick={() => onClose(false)}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="100%"
            onMouseMove={handleMove}
            onMouseUp={handleEndWithHitTest}
            onTouchMove={handleMove}
            onTouchEnd={handleEndWithHitTest}
            onTouchCancel={handleEndWithHitTest}
            onMouseLeave={handleEnd}
            className={styles.cseGameSVG}
            style={{ touchAction: "none" }}
          >
            {[...Array(colors.length + 1)].map((_, i) => (
              <line key={`bar-${i}`} x1={leftX - railInset} y1={padding - rowGap / 2 + i * rowGap}
                    x2={rightX + railInset} y2={padding - rowGap / 2 + i * rowGap}
                    stroke="#222" strokeWidth={16} strokeLinecap="round"/>
            ))}
            {[...connections.entries()].map(([lIdx, rIdx]) => {
              const L = leftSockets.find(s => s.idx === lIdx);
              const R = rightSockets.find(s => s.idx === rIdx);
              // 대각선 직선으로 변경
              return (
                <line key={`wire-${lIdx}`} x1={L.x + socketRadius} y1={L.y} x2={R.x - socketRadius} y2={R.y}
                  stroke={colors[lIdx]} strokeWidth={wireWidth} strokeLinecap="round" />
              );
            })}
            {drag && (
              <line
                x1={drag.from.side === "left" ? drag.from.x + socketRadius : drag.pos.x}
                y1={drag.from.side === "left" ? drag.from.y : drag.pos.y}
                x2={drag.from.side === "right" ? drag.from.x - socketRadius : drag.pos.x}
                y2={drag.from.side === "right" ? drag.from.y : drag.pos.y}
                stroke={drag.from.color} strokeWidth={wireWidth} strokeLinecap="round"
              />
            )}
            {leftSockets.map((s) => (
              <g key={`L-${s.idx}`} transform={`translate(${s.x},${s.y})`}>
                <SocketCircle color={s.color} radius={socketRadius}
                  onDown={handleStart(s)} onUp={handleDropOn(s)} />
              </g>
            ))}
            {rightSockets.map((s) => (
              <g key={`R-${s.idx}`} transform={`translate(${s.x},${s.y})`}>
                <SocketCircle color={s.color} radius={socketRadius}
                  onDown={handleStart(s)} onUp={handleDropOn(s)} />
              </g>
            ))}
          </svg>
          {/* 결과 메시지 */}
          {showResult && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <div>
                {!isCorrect && (
                  <div>
                    <p>오답! 코코모가 도망쳤습니다.</p>
                  </div>
                )}
                {isCorrect && (
                  <div>
                    <p>코코모 획득 완료!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 제출 전 컨트롤 버튼들 */}
          {!showResult && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                className={styles.cseGameButton}
                onClick={handleReset}
                disabled={connections.size === 0}
                title={connections.size === 0 ? '연결이 없습니다' : '모든 연결을 초기화합니다'}
              >
                연결 초기화
              </button>
              <button
                className={styles.cseGameButton}
                onClick={handleSubmit}
                disabled={connections.size !== colors.length}
                title={connections.size !== colors.length ? '모든 회로를 연결해야 제출할 수 있어요' : '제출'}
              >
                제출
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocketCircle({ color, radius, onDown, onUp }) {
  return (
    <g onMouseDown={onDown} onMouseUp={onUp} onTouchStart={onDown} onTouchEnd={onUp} style={{ cursor: "pointer" }}>
      <circle cx={0} cy={0} r={radius + 6} fill="#121212" stroke="#2e2e2e" strokeWidth={3} />
      <circle cx={0} cy={0} r={radius} fill={color} />
    </g>
  );
}

export default CSEGame;