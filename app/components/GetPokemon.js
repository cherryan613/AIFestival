'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from '../style/BattleScreen.module.css';
// import dexStyles from '../style/MainPage.module.css';

// battleType: 1=AI, 2=DS, 3=CS, 4=CSE, 5=AIDS
// BattleScreen과 동일한 레이아웃을 사용하되, 하단 버튼만 변경
const GetPokemon = ({ battleType = 1, onBack }) => {
	// BGM 재생 상태
	const audioRef = useRef(null);

	useEffect(() => {
		// GetPokemon 진입 시 BGM 재생 (한 번만)
		const audio = new Audio('/bgm/get.mp3');
		audio.loop = false;
		audio.volume = 1.0; // 필요 시 조절 가능
		audioRef.current = audio;

		const tryPlay = () => {
			try {
				const p = audio.play();
				if (p && typeof p.then === 'function') {
					p.catch(() => {});
				}
			} catch {}
		};
		tryPlay();

		// 사용자 입력 시 자동 재시도
		const resumeOnUserGesture = () => tryPlay();
		window.addEventListener('pointerdown', resumeOnUserGesture, { once: true });
		window.addEventListener('touchstart', resumeOnUserGesture, { once: true });
		window.addEventListener('keydown', resumeOnUserGesture, { once: true });

		return () => {
			// 화면 이탈 시 정리
			try {
				audio.pause();
				audio.currentTime = 0;
			} catch {}
			audioRef.current = null;
			window.removeEventListener('pointerdown', resumeOnUserGesture);
			window.removeEventListener('touchstart', resumeOnUserGesture);
			window.removeEventListener('keydown', resumeOnUserGesture);
		};
	}, []);
	// 타입별 정보 이미지 매핑 (원하는 파일명으로 교체해서 public/info 폴더에 넣어주세요)
	const infoImageMap = {
		1: '/info/잉쥐_정보.png',
		2: '/info/데이리_정보.png',
		3: '/info/시큐_정보.png',
		4: '/info/코코모_정보.png',
		5: '/info/잉데쀼_정보.png',
	};
	const defaultInfoImage = '/info/pokemon_info.png';
	const getInfoImage = () => infoImageMap[battleType] || defaultInfoImage;

	const getBattleImage = () => {
		switch (battleType) {
			case 1:
				return '/clear/승리폼_잉쥐.png';
			case 2:
				return '/clear/승리폼_데이리.png';
			case 3:
				return '/clear/승리폼_시큐.png';
			case 4:
				return '/clear/승리폼_코코모.png';
			case 5:
				return '/clear/승리폼_잉데쀼.png';
			default:
				return '/Map2.png';
		}
	};

	const getPokemonName = () => {
		switch (battleType) {
			case 1:
				return '잉쥐';
			case 2:
				return '데이리';
			case 3:
				return '시큐';
			case 4:
				return '코코모';
			case 5:
				return '잉데쀼';
			default:
				return '이아이';
		}
	};

	return (
		<div className={styles.battleContainer}>
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

			{/* 화면 - BattleScreen과 동일한 영역 */}
				<div className={styles.battleScreenSection}>
					<div className={styles.battleScreen}>
					<Image 
						src={getBattleImage()}
						alt="Get Pokemon Background" 
						width={800}
						height={600}
						className={styles.battleMapImage}
						priority
					/>
				</div>
			</div>

			<div className={styles.battleControlSection}>
				<div className={styles.battleControls}>
					{/* 중앙 메인 영역: 포켓몬 정보 표시 공간 */}
					<div className={styles.battleMainButton}>
						<div className={styles.infoPanel} style={{ padding: 0 }}>
							<img src={getInfoImage()} alt="포켓몬 정보" className={styles.infoOnlyImage} />
						</div>
					</div>
					<button 
						className={styles.getSubBtn}
						onClick={onBack}
					>
						돌아가기
					</button>
				</div>
			</div>
		</div>
	);
};

export default GetPokemon;
