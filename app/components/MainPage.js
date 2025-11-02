'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { createMapData, isWalkable, isInteractable, findNearbyInteractables, getCatchZones, removeCatchZone, regenerateCatchZones } from '../utils/mapUtils';
import styles from '../style/MainPage.module.css';
import BattleScreen from './BattleScreen';
import GetPokemon from './GetPokemon';

const MainPage = ({ onEnterGame }) => {
  // 게임 상태
  const [playerPosition, setPlayerPosition] = useState({ x: 625, y: 770 }); // 시작 위치 변경 (가로 중앙, 세로 하단 20%)
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 }); // 기본 카메라 오프셋
  const [isMoving, setIsMoving] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [nearbyInteractables, setNearbyInteractables] = useState([]);
  const [currentDirection, setCurrentDirection] = useState({ x: 0, y: 0 });
  const [currentMiniGame, setCurrentMiniGame] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isDexModalOpen, setIsDexModalOpen] = useState(false); // 도감 모달 상태
  const [isPokemonModalOpen, setIsPokemonModalOpen] = useState(false); // 포켓몬 탭 모달 상태
  const [selectedPokemonId, setSelectedPokemonId] = useState(1); // 선택된 포켓몬
  const [screenSize, setScreenSize] = useState({ width: 400, height: 300 });
  const [clearedGames, setClearedGames] = useState(new Set()); // 클리어한 게임들 추적
  const [isBattleMode, setIsBattleMode] = useState(false); // 전투 모드 상태
  const [zonesInitialized, setZonesInitialized] = useState(false); // 잡기 영역 초기화 상태
  const [isGetPokemonMode, setIsGetPokemonMode] = useState(false); // 포획 화면 전환 상태
  // 맵 BGM
  const mapAudioRef = useRef(null);
  
  // 조이스틱 상태
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs
  const gameContainerRef = useRef(null);
  const mapRef = useRef(null);
  const joystickRef = useRef(null);
  const handleRef = useRef(null);
  const moveIntervalRef = useRef(null);
  
  // 맵 설정
  const MAP_WIDTH = 1280;
  const MAP_HEIGHT = 960;
  const TILE_SIZE = 16;
  const PLAYER_SPEED = 4;
  const ZOOM_SCALE = 1; // 맵 확대 비율
  
  // 게임 화면 크기
  const SCREEN_WIDTH = screenSize.width;
  const SCREEN_HEIGHT = screenSize.height;
  
  // 화면 크기 초기화
  useEffect(() => {
    const updateScreenSize = () => {
      if (!gameContainerRef.current) return;
      
      const rect = gameContainerRef.current.getBoundingClientRect();
      setScreenSize({
        width: rect.width,
        height: rect.height
      });
    };
    
    // 초기 로드 시 약간의 지연을 두고 측정
    setTimeout(updateScreenSize, 100);
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  // 맵 데이터 초기화
  useEffect(() => {
    const data = createMapData(Math.floor(MAP_WIDTH / TILE_SIZE), Math.floor(MAP_HEIGHT / TILE_SIZE));
    setMapData(data);
    
    // 클라이언트에서만 잡기 영역 생성
    regenerateCatchZones();
    setZonesInitialized(true);
  }, []);
  
  // 카메라 업데이트 - 플레이어가 중앙에 오도록 (확대된 맵 기준)
  useEffect(() => {
    const scaledMapWidth = MAP_WIDTH * ZOOM_SCALE;
    const scaledMapHeight = MAP_HEIGHT * ZOOM_SCALE;
    const scaledPlayerX = playerPosition.x * ZOOM_SCALE;
    const scaledPlayerY = playerPosition.y * ZOOM_SCALE;
    
    const newOffsetX = Math.max(0, Math.min(scaledMapWidth - SCREEN_WIDTH, scaledPlayerX - SCREEN_WIDTH / 2));
    const newOffsetY = Math.max(0, Math.min(scaledMapHeight - SCREEN_HEIGHT, scaledPlayerY - SCREEN_HEIGHT / 2));
    
    setCameraOffset({ x: newOffsetX, y: newOffsetY });
  }, [playerPosition, SCREEN_WIDTH, SCREEN_HEIGHT]);
  
  // 주변 상호작용 가능한 영역 업데이트
  useEffect(() => {
    if (mapData) {
      const interactables = findNearbyInteractables(playerPosition.x, playerPosition.y, mapData, 48, TILE_SIZE);
      setNearbyInteractables(interactables);
    }
  }, [playerPosition, mapData]);

  // 현재 플레이어가 잡기 가능한 영역에 있는지 확인
  const isInCatchArea = mapData ? isInteractable(playerPosition.x, playerPosition.y, mapData, TILE_SIZE) : false;

  // 조이스틱 터치/마우스 이벤트 처리
  const handleJoystickStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches ? e.touches[0] : e;
    updateJoystickPosition(touch);
  };

  const handleJoystickMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    updateJoystickPosition(touch);
  };

  const handleJoystickEnd = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setJoystickPosition({ x: 0, y: 0 });
    setCurrentDirection({ x: 0, y: 0 });
    setIsMoving(false);
    if (handleRef.current) {
      handleRef.current.style.transform = 'translate(0px, 0px)';
    }
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  };

  const updateJoystickPosition = (touch) => {
    if (!joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    
    const maxDistance = 40; // 조이스틱 최대 이동 거리 (작아진 조이스틱에 맞춤)
    const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    setJoystickPosition({ x, y });
    
    // 핸들 시각적 이동
    if (handleRef.current) {
      handleRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
    
    // 현재 방향 업데이트
    if (distance > 10) {
      const normalizedX = x / maxDistance;
      const normalizedY = y / maxDistance;
      setCurrentDirection({ x: normalizedX, y: normalizedY });
      setIsMoving(true);
    } else {
      setCurrentDirection({ x: 0, y: 0 });
      setIsMoving(false);
    }
  };

  // 연속 이동을 위한 useEffect
  useEffect(() => {
    if (!isDragging || (currentDirection.x === 0 && currentDirection.y === 0)) {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
      return;
    }
    
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
    }
    
    moveIntervalRef.current = setInterval(() => {
      movePlayerContinuous(currentDirection.x, currentDirection.y);
    }, 30);
    
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
    };
  }, [isDragging, currentDirection.x, currentDirection.y, mapData]);

  const movePlayerContinuous = (deltaX, deltaY) => {
    if (!mapData) return;
    
    setPlayerPosition(prev => {
      const newX = prev.x + deltaX * PLAYER_SPEED;
      const newY = prev.y + deltaY * PLAYER_SPEED;
      
      if (isWalkable(newX, newY, mapData, TILE_SIZE)) {
        return { x: newX, y: newY };
      }
      return prev;
    });
  };

  // 상호작용 처리
  // 랜덤으로 아직 클리어하지 않은 게임만 배틀타입으로 선택
  const [battleType, setBattleType] = useState(1);

  const handleInteraction = () => {
    if (!mapData) return;
    const isOnGrass = isInteractable(playerPosition.x, playerPosition.y, mapData, TILE_SIZE);
    if (isOnGrass) {
      // uncleared games만 랜덤 선택
      const uncleared = [1, 2, 3, 4, 5].filter(g => !clearedGames.has(g));
      if (uncleared.length === 0) {
        alert('모든 게임을 클리어했습니다!');
        return;
      }
      const randomIdx = Math.floor(Math.random() * uncleared.length);
      setBattleType(uncleared[randomIdx]);
      setIsBattleMode(true);
    }
  };
  
  // 미니게임 닫기
  const closeMiniGame = (isCleared = false) => {
    if (isCleared && currentMiniGame) {
      setClearedGames(prev => new Set([...prev, currentMiniGame]));
    }
    setCurrentMiniGame(null);
  };

  // 맵 모달 열기/닫기
  const openMapModal = () => {
    setIsMapModalOpen(true);
  };

  const closeMapModal = () => {
    setIsMapModalOpen(false);
  };

  // 도감 모달 열기/닫기
  const openDexModal = () => {
    setIsDexModalOpen(true);
  };

  const closeDexModal = () => {
    setIsDexModalOpen(false);
  };

  // 포켓몬 모달 열기/닫기
  const openPokemonModal = () => {
    setIsPokemonModalOpen(true);
  };
  const closePokemonModal = () => {
    setIsPokemonModalOpen(false);
  };

  const POKEMON_LIST = [
    { id: 1, name: '잉쥐', info: '/info/잉쥐_정보.png' },
    { id: 2, name: '데이리', info: '/info/데이리_정보.png' },
    { id: 3, name: '시큐', info: '/info/시큐_정보.png' },
    { id: 4, name: '코코모', info: '/info/코코모_정보.png' },
    { id: 5, name: '잉데쀼', info: '/info/잉데쀼_정보.png' },
  ];

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleJoystickMove);
      document.addEventListener('mouseup', handleJoystickEnd);
      document.addEventListener('touchmove', handleJoystickMove);
      document.addEventListener('touchend', handleJoystickEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleJoystickMove);
      document.removeEventListener('mouseup', handleJoystickEnd);
      document.removeEventListener('touchmove', handleJoystickMove);
      document.removeEventListener('touchend', handleJoystickEnd);
    };
  }, [isDragging]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
    };
  }, []);

  // 맵 배경음: 배틀/포획 화면이 아닐 때만 재생, 그 외에는 일시정지
  useEffect(() => {
    // 배틀/포획 화면에서는 맵 BGM을 멈춤
    if (isBattleMode || isGetPokemonMode) {
      if (mapAudioRef.current) {
        try {
          mapAudioRef.current.pause();
        } catch {}
      }
      return;
    }

    // 맵 화면: BGM이 없다면 생성 후 루프 재생
    if (!mapAudioRef.current) {
      const audio = new Audio('/bgm/무쇠시티_bgm.mp3');
      audio.loop = true;
      audio.volume = 1.0;
      mapAudioRef.current = audio;
    }
    const tryPlay = () => {
      try {
        const p = mapAudioRef.current.play();
        if (p && typeof p.then === 'function') {
          p.catch(() => {});
        }
      } catch {}
    };
    tryPlay();

    // 사용자 입력 시 재시도 (버튼 없이 자동)
    const resumeOnUserGesture = () => tryPlay();
    window.addEventListener('pointerdown', resumeOnUserGesture, { once: true });
    window.addEventListener('touchstart', resumeOnUserGesture, { once: true });
    window.addEventListener('keydown', resumeOnUserGesture, { once: true });

    return () => {
      // 컴포넌트 언마운트 시 정리
      if (mapAudioRef.current && (isBattleMode || isGetPokemonMode)) {
        try {
          mapAudioRef.current.pause();
          mapAudioRef.current.currentTime = 0;
        } catch {}
      }
      window.removeEventListener('pointerdown', resumeOnUserGesture);
      window.removeEventListener('touchstart', resumeOnUserGesture);
      window.removeEventListener('keydown', resumeOnUserGesture);
    };
  }, [isBattleMode, isGetPokemonMode]);

  // 전체 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (mapAudioRef.current) {
        try {
          mapAudioRef.current.pause();
          mapAudioRef.current.currentTime = 0;
        } catch {}
        mapAudioRef.current = null;
      }
    };
  }, []);

  // 전투 모드일 때 BattleScreen 컴포넌트 렌더링
  if (isBattleMode) {
    return (
      <BattleScreen 
        clearedGames={clearedGames}
        setClearedGames={setClearedGames}
        onBack={() => setIsBattleMode(false)}
        onOpenDex={openDexModal}
        battleType={battleType}
        onCleared={() => {
          // 게임 클리어 시 현재 위치의 잡기 영역 제거
          removeCatchZone(playerPosition.x, playerPosition.y, TILE_SIZE);
          // 포획 화면으로 이동
          setIsGetPokemonMode(true);
        }}
      />
    );
  }

  // 미니게임 클리어 후 포획 화면
  if (isGetPokemonMode) {
    return (
      <>
        <GetPokemon
          battleType={battleType}
          onBack={() => setIsGetPokemonMode(false)}
          onOpenDex={openDexModal}
          clearedGames={clearedGames}
        />

        {/* 도감 모달 (포획 화면에서도 표시) - GetPokemon 내부에서 인라인으로 도감을 보여주므로 대부분 사용되지 않음 */}
        {isDexModalOpen && (
          <div className={styles.popUpModal} onClick={closeDexModal}>
            <div className={styles.popUpModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.popUpModalHeader}>
                <h3>도감</h3>
                <button className={styles.closeButton} onClick={closeDexModal}>
                  ✕
                </button>
              </div>
              <div className={styles.dexContainer}>
                <div className={styles.dexGrid}>
                  {/* 인공지능전공 */}
                  <div className={`${styles.dexCard} ${clearedGames.has(1) ? styles.cleared : styles.silhouette}`}>
                    <div className={styles.cardContent}>
                      <img
                        src={clearedGames.has(1) ? "/charactor/잉쥐.png" : "/charactor/잉쥐_실루엣.png"}
                        alt="AI Pokemon"
                        className={styles.cardPokemon}
                      />
                      <div className={styles.cardSubtitle}>
                        {clearedGames.has(1) ? '잉쥐' : '???'}
                      </div>
                    </div>
                  </div>
                  {/* 데이터사이언스전공 */}
                  <div className={`${styles.dexCard} ${clearedGames.has(2) ? styles.cleared : styles.silhouette}`}>
                    <div className={styles.cardContent}>
                      <img
                        src={clearedGames.has(2) ? "/charactor/데이리.png" : "/charactor/데이리_실루엣.png"}
                        alt="DS Pokemon"
                        className={styles.cardPokemon}
                      />
                      <div className={styles.cardSubtitle}>
                        {clearedGames.has(2) ? '데이리' : '???'}
                      </div>
                    </div>
                  </div>
                  {/* 사이버보안학과 */}
                  <div className={`${styles.dexCard} ${clearedGames.has(3) ? styles.cleared : styles.silhouette}`}>
                    <div className={styles.cardContent}>
                      <img
                        src={clearedGames.has(3) ? "/charactor/시큐.png" : "/charactor/시큐_실루엣.png"}
                        alt="CS Pokemon"
                        className={styles.cardPokemon}
                      />
                      <div className={styles.cardSubtitle}>
                        {clearedGames.has(3) ? '시큐' : '???'}
                      </div>
                    </div>
                  </div>
                  {/* 컴퓨터공학과 */}
                  <div className={`${styles.dexCard} ${clearedGames.has(4) ? styles.cleared : styles.silhouette}`}>
                    <div className={styles.cardContent}>
                      <img
                        src={clearedGames.has(4) ? "/charactor/코코모.png" : "/charactor/코코모_실루엣.png"}
                        alt="CSE Pokemon"
                        className={styles.cardPokemon}
                      />
                      <div className={styles.cardSubtitle}>
                        {clearedGames.has(4) ? '코코모' : '???'}
                      </div>
                    </div>
                  </div>
                  {/* 인공지능데이터사이언스학부 */}
                  <div className={`${styles.dexCard} ${clearedGames.has(5) ? styles.cleared : styles.silhouette}`}>
                    <div className={styles.cardContent}>
                      <img
                        src={clearedGames.has(5) ? "/charactor/잉데쀼.png" : "/charactor/잉데쀼_실루엣.png"}
                        alt="AIDS Pokemon"
                        className={styles.cardPokemon}
                      />
                      <div className={styles.cardSubtitle}>
                        {clearedGames.has(5) ? '잉데쀼' : '???'}
                      </div>
                    </div>
                  </div>
                  {/* 이아이 - 모든 게임 클리어 시에만 표시 */}
                  <div className={`${styles.dexCard} ${clearedGames.size >= 5 ? styles.cleared : styles.silhouette}`}>
                    <div className={styles.cardContent}>
                      <img
                        src={clearedGames.size === 5 ? "/charactor/이아이.png" : "/charactor/이아이_실루엣.png"}
                        alt="E-AI Pokemon"
                        className={styles.cardPokemon}
                      />
                      <div className={styles.cardSubtitle}>
                        {clearedGames.size === 5 ? '이아이' : '???'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={styles.mainContainer}>
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
      
      {/* 메인 화면 영역 - 맵 모드에서는 더 크게 */}
      <div className={styles.gameScreenSection}>
        <div 
          ref={gameContainerRef}
          className={styles.gameScreen}
        >
          {/* 맵 컨테이너 */}
          <div
            ref={mapRef}
            className={styles.gameMapContainer}
            style={{
              transform: `translate(-${cameraOffset.x}px, -${cameraOffset.y}px) scale(${ZOOM_SCALE})`,
              transformOrigin: 'top left',
              width: `${MAP_WIDTH}px`,
              height: `${MAP_HEIGHT}px`
            }}
          >
            <Image 
              src="/Map.png"
              alt="Game Map" 
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              className={styles.gameMapImage}
              priority
            />
            
            {/* 잡기 영역 반짝임 표시 */}
            {getCatchZones().map((zone, index) => {
              const centerX = (zone.x + zone.width / 2) * TILE_SIZE;
              const centerY = (zone.y + zone.height / 2) * TILE_SIZE;
              return (
                <div
                  key={`sparkle-${index}`}
                  className={styles.catchSparkle}
                  style={{
                    left: `${centerX}px`,
                    top: `${centerY}px`,
                  }}
                />
              );
            })}
          </div>
          
          {/* 플레이어 캐릭터 */}
          <div 
            className={`${styles.player} ${isMoving ? styles.moving : ''}`}
            style={{
              left: `${playerPosition.x - cameraOffset.x}px`,
              top: `${playerPosition.y - cameraOffset.y}px`,
              transform: 'translate(-50%, -50%)' // 중앙 정렬
            }}
          >
            <img src="/player.png" alt="Player" className={styles.player}/>
          </div>
        </div>
      </div>
      
      {/* 하단 컨트롤 - 조이스틱 중앙, 버튼 좌우 배치 */}
      <div className={styles.controlSection}>
        {/* 왼쪽 버튼: 도감, 포켓몬 */}
        <div className={styles.leftButtons}>
          <button 
            className={styles.actionButton}
            onClick={openMapModal}
          >
            맵확인
          </button>
          <button 
            className={styles.actionButton}
            onClick={openPokemonModal}
          >
            포켓몬
          </button>
        </div>
        {/* 중앙 조이스틱 */}
        <div className={styles.directionControl}>
          <div className={styles.joystickContainer}>
            <div 
              className={styles.joystickBase}
              ref={joystickRef}
              onMouseDown={handleJoystickStart}
              onTouchStart={handleJoystickStart}
            >
              <div 
                className={styles.joystickHandle}
                ref={handleRef}
              ></div>
            </div>
          </div>
        </div>
        {/* 오른쪽 버튼: 잡기, 맵확인 */}
        <div className={styles.rightButtons}>
          <button 
            className={`${styles.actionButton} ${isInCatchArea ? styles.activeButton : ''}`}
            onClick={handleInteraction}
          >
            잡기
          </button>
          <button 
            className={styles.actionButton}
            onClick={openDexModal}
          >
            도감
          </button>
        </div>
      </div>
      
      {/* 포켓몬 정보 모달 */}
      {isPokemonModalOpen && (
        <div className={styles.popUpModal} onClick={closePokemonModal}>
          <div className={styles.popUpModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popUpModalHeader}>
              <h3>포켓몬</h3>
              <button className={styles.closeButton} onClick={closePokemonModal}>
                ✕
              </button>
            </div>
            <div className={styles.pokemonTabs}>
              {POKEMON_LIST.map(p => (
                <button
                  key={p.id}
                  className={`${styles.pokemonTab} ${selectedPokemonId === p.id ? styles.activePokemonTab : ''}`}
                  onClick={() => setSelectedPokemonId(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className={styles.pokemonContentBox}>
              <img
                src={POKEMON_LIST.find(p => p.id === selectedPokemonId)?.info || ''}
                alt="포켓몬 정보"
                className={styles.pokemonImage}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* 도감 모달 */}
      {isDexModalOpen && (
        <div className={styles.popUpModal} onClick={closeDexModal}>
          <div className={styles.popUpModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popUpModalHeader}>
              <h3>도감</h3>
              <button className={styles.closeButton} onClick={closeDexModal}>
                ✕
              </button>
            </div>
            <div className={styles.dexContainer}>
              <div className={styles.dexGrid}>
                {/* 인공지능전공 */}
                <div className={`${styles.dexCard} ${clearedGames.has(1) ? styles.cleared : styles.silhouette}`}>
                  <div className={styles.cardContent}>
                    <img
                      src={clearedGames.has(1) ? "/charactor/잉쥐.png" : "/charactor/잉쥐_실루엣.png"}
                      alt="AI Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>
                      {clearedGames.has(1) ? '잉쥐' : '???'}
                    </div>
                  </div>
                </div>
                
                {/* 데이터사이언스전공 */}
                <div className={`${styles.dexCard} ${clearedGames.has(2) ? styles.cleared : styles.silhouette}`}>
                  <div className={styles.cardContent}>
                    <img
                      src={clearedGames.has(2) ? "/charactor/데이리.png" : "/charactor/데이리_실루엣.png"}
                      alt="DS Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>
                      {clearedGames.has(2) ? '데이리' : '???'}
                    </div>
                  </div>
                </div>

                {/* 사이버보안학과 */}
                <div className={`${styles.dexCard} ${clearedGames.has(3) ? styles.cleared : styles.silhouette}`}>
                  <div className={styles.cardContent}>
                    <img
                      src={clearedGames.has(3) ? "/charactor/시큐.png" : "/charactor/시큐_실루엣.png"}
                      alt="CS Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>
                      {clearedGames.has(3) ? '시큐' : '???'}
                    </div>
                  </div>
                </div>
                
                {/* 컴퓨터공학과 */}
                <div className={`${styles.dexCard} ${clearedGames.has(4) ? styles.cleared : styles.silhouette}`}>
                  <div className={styles.cardContent}>
                    <img
                      src={clearedGames.has(4) ? "/charactor/코코모.png" : "/charactor/코코모_실루엣.png"}
                      alt="CSE Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>
                      {clearedGames.has(4) ? '코코모' : '???'}
                    </div>
                  </div>
                </div>
                
                {/* 인공지능데이터사이언스학부 */}
                <div className={`${styles.dexCard} ${clearedGames.has(5) ? styles.cleared : styles.silhouette}`}>
                  <div className={styles.cardContent}>
                    <img
                      src={clearedGames.has(5) ? "/charactor/잉데쀼.png" : "/charactor/잉데쀼_실루엣.png"}
                      alt="AIDS Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>
                      {clearedGames.has(5) ? '잉데쀼' : '???'}
                    </div>
                  </div>
                </div>

                {/* 이아이 - 모든 게임 클리어 시에만 표시 */}
                <div className={`${styles.dexCard} ${clearedGames.size >= 5 ? styles.cleared : styles.silhouette}`}>
                  <div className={styles.cardContent}>
                    <img
                      src={clearedGames.size === 5 ? "/charactor/이아이.png" : "/charactor/이아이_실루엣.png"}
                      alt="E-AI Pokemon"
                      className={styles.cardPokemon}
                    />
                    <div className={styles.cardSubtitle}>
                      {clearedGames.size === 5 ? '이아이' : '???'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 맵 모달 */}
      {isMapModalOpen && (
        <div className={styles.popUpModal} onClick={closeMapModal}>
          <div className={styles.popUpModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popUpModalHeader}>
              <h3>전체 맵</h3>
              <button className={styles.closeButton} onClick={closeMapModal}>
                ✕
              </button>
            </div>
            <div className={styles.fullMapContainer}>
              <Image 
                src="/Map.png" 
                alt="Full Map" 
                width={MAP_WIDTH}
                height={MAP_HEIGHT}
                className={styles.fullMapImage}
              />
              {/* 잡기 활성화 영역 핀 표시 */}
              {getCatchZones().map((zone, index) => {
                // 영역의 중앙 좌표 계산
                const centerX = (zone.x + zone.width / 2) * TILE_SIZE;
                const centerY = (zone.y + zone.height / 2) * TILE_SIZE;
                return (
                  <div
                    key={index}
                    className={styles.catchZone}
                    style={{
                      left: `${(centerX / MAP_WIDTH) * 100}%`,
                      top: `${(centerY / MAP_HEIGHT) * 100}%`,
                    }}
                  />
                );
              })}
              {/* 플레이어 위치 표시 */}
              <div 
                className={styles.playerMarker}
                style={{
                  left: `${(playerPosition.x / MAP_WIDTH) * 100}%`,
                  top: `${(playerPosition.y / MAP_HEIGHT) * 100}%`
                }}
              >
                🔴
              </div>
              {/* 현재 보이는 화면 영역 표시 */}
              <div 
                className={styles.viewportIndicator}
                style={{
                  left: `${(cameraOffset.x / MAP_WIDTH) * 100}%`,
                  top: `${(cameraOffset.y / MAP_HEIGHT) * 100}%`,
                  width: `${(SCREEN_WIDTH / MAP_WIDTH) * 100}%`,
                  height: `${(SCREEN_HEIGHT / MAP_HEIGHT) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;