// 게임 맵의 충돌 감지와 상호작용을 위한 유틸리티

// 맵의 타일 타입 정의
export const TILE_TYPES = {
  WALKABLE: 0,    // 걸을 수 있는 길
  BLOCKED: 1,     // 차단된 영역 (나무, 돌 등)
  GRASS: 2,       // 풀숲 (상호작용 가능)
};

// 맵 데이터 생성 (실제 맵 이미지를 분석해서 만든 데이터)
// 전체 맵을 걸을 수 있는 영역으로 설정 (풀숲은 상호작용 가능)
export const createMapData = (width, height) => {
  const map = [];
  
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // 기본적으로 모든 영역을 걸을 수 있는 것으로 설정
      let tileType = TILE_TYPES.WALKABLE;
      
      row.push(tileType);
    }
    map.push(row);
  }
  
  return map;
};

// 충돌 감지 함수
export const isWalkable = (x, y, mapData, tileSize = 16) => {
  // 맵의 픽셀 크기 계산
  const mapPixelWidth = mapData[0].length * tileSize;
  const mapPixelHeight = mapData.length * tileSize;
  
  // 픽셀 단위로 맵 범위 체크 (약간의 여유 포함)
  if (x < 0 || x + tileSize > mapPixelWidth || y < 0 || y + tileSize > mapPixelHeight) {
    return false;
  }
  
  const tileX = Math.floor(x / tileSize);
  const tileY = Math.floor(y / tileSize);
  
  // 타일 인덱스가 유효한지 확인
  if (tileY < 0 || tileY >= mapData.length || tileX < 0 || tileX >= mapData[0].length) {
    return false;
  }
  
  const tileType = mapData[tileY][tileX];
  return tileType === TILE_TYPES.WALKABLE || tileType === TILE_TYPES.GRASS;
};

// 상호작용 가능한 영역인지 확인
export const isInteractable = (x, y, mapData, tileSize = 16) => {
  const tileX = Math.floor(x / tileSize);
  const tileY = Math.floor(y / tileSize);
  
  if (tileY < 0 || tileY >= mapData.length || tileX < 0 || tileX >= mapData[0].length) {
    return false;
  }
  
  // 생성된 잡기 영역에 있는지 확인
  return catchZones.some(zone =>
    tileX >= zone.x && tileX < zone.x + zone.width &&
    tileY >= zone.y && tileY < zone.y + zone.height
  );
};

// 풀숲 영역 정의 (타일 단위 좌표)
// 맵 전체: 80x60 타일 (1280x960 픽셀 / 16 타일 크기)
// { x: 타일X좌표, y: 타일Y좌표, width: 너비(타일), height: 높이(타일) }
const grassAreas = [
  { x: 2, y: 32, width: 7, height: 14 },

  { x: 18, y: 18, width: 15, height: 5 },
  { x: 14, y: 24, width: 7, height: 7 },
  { x: 22, y: 24, width: 3, height: 3 },
  { x: 30, y: 24, width: 3, height: 3 },

  
  { x: 24, y: 45, width: 8, height: 6 },
  { x: 20, y: 51, width: 14, height: 13 },

  { x: 44, y: 24, width: 7, height: 10 },
  { x: 52, y: 30, width: 6, height: 3 },

  { x: 58, y: 20, width: 15, height: 5 },
  { x: 60, y: 25, width: 7, height: 3 },
  { x: 65, y: 28, width: 7, height: 4 },

  { x: 48, y: 50 , width: 11, height: 7 },
  { x: 60, y: 51 , width: 3, height: 3 }
  
];

// 타일이 풀숲 영역에 있는지 확인
const isInGrassArea = (tileX, tileY) => {
  return grassAreas.some(area => 
    tileX >= area.x && tileX < area.x + area.width &&
    tileY >= area.y && tileY < area.y + area.height
  );
};

// 풀숲 영역에서 랜덤으로 잡기 영역 5개 생성
const generateRandomCatchZones = () => {
  const zones = [];
  const zoneSize = 5; // 5x5 타일 크기
  
  // 각 풀숲 영역에서 랜덤 위치 선택
  const shuffledAreas = [...grassAreas].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(5, shuffledAreas.length); i++) {
    const area = shuffledAreas[i];
    // 풀숲 영역 내에서 랜덤 위치 (경계에서 약간 안쪽)
    const maxX = Math.max(area.x, area.x + area.width - zoneSize - 1);
    const maxY = Math.max(area.y, area.y + area.height - zoneSize - 1);
    const randomX = area.x + Math.floor(Math.random() * Math.max(1, area.width - zoneSize));
    const randomY = area.y + Math.floor(Math.random() * Math.max(1, area.height - zoneSize));
    
    zones.push({
      x: randomX,
      y: randomY,
      width: zoneSize,
      height: zoneSize
    });
  }
  
  return zones;
};

// 잡기 활성화 영역 좌표 (초기에는 비어있음)
let catchZones = [];

export const getCatchZones = () => {
  return catchZones;
};

// 새로고침 시 잡기 영역 재생성
export const regenerateCatchZones = () => {
  catchZones = generateRandomCatchZones();
  return catchZones;
};

// 특정 잡기 영역 제거 (클리어 시)
export const removeCatchZone = (playerX, playerY, tileSize = 16) => {
  const tileX = Math.floor(playerX / tileSize);
  const tileY = Math.floor(playerY / tileSize);
  
  // 플레이어가 있는 잡기 영역 찾기
  const zoneIndex = catchZones.findIndex(zone =>
    tileX >= zone.x && tileX < zone.x + zone.width &&
    tileY >= zone.y && tileY < zone.y + zone.height
  );
  
  if (zoneIndex !== -1) {
    catchZones.splice(zoneIndex, 1);
  }
};

// 플레이어 주변의 상호작용 가능한 영역 찾기
export const findNearbyInteractables = (playerX, playerY, mapData, range = 32, tileSize = 16) => {
  const interactables = [];
  
  for (let dx = -range; dx <= range; dx += tileSize) {
    for (let dy = -range; dy <= range; dy += tileSize) {
      const checkX = playerX + dx;
      const checkY = playerY + dy;
      
      if (isInteractable(checkX, checkY, mapData, tileSize)) {
        interactables.push({ x: checkX, y: checkY });
      }
    }
  }
  
  return interactables;
};