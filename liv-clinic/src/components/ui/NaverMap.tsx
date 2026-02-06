'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface NaverMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
  markerTitle?: string;
}

declare global {
  interface Window {
    naver: typeof naver;
    navermap_authFailure?: () => void;
    __naverMapCallbacks?: Array<() => void>;
  }
}

export default function NaverMap({
  lat,
  lng,
  zoom = 17,
  className = '',
  markerTitle = '리브성형외과'
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | false>(false);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.naver?.maps) return;

    // 컨테이너 크기가 0이면 지도 초기화 불가 - 리사이즈 대기
    const rect = mapRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn('[NaverMap] 컨테이너 크기 0 감지, 100ms 후 재시도');
      setTimeout(() => initMap(), 100);
      return;
    }

    const position = new window.naver.maps.LatLng(lat, lng);

    const map = new window.naver.maps.Map(mapRef.current, {
      center: position,
      zoom: zoom,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT
      },
      mapTypeControl: false,
      scaleControl: true,
      logoControl: true,
      mapDataControl: false,
    });

    mapInstanceRef.current = map;

    const marker = new window.naver.maps.Marker({
      position: position,
      map: map,
      title: markerTitle,
      animation: window.naver.maps.Animation.DROP,
    });

    const infoWindow = new window.naver.maps.InfoWindow({
      content: '<div style="padding: 12px 16px; min-width: 180px;"><h4 style="margin: 0 0 4px 0; font-weight: 600; color: #6d4e42;">리브성형외과</h4><p style="margin: 0; font-size: 13px; color: #575756;">신사역 4번 출구 도보 1분</p></div>',
      borderWidth: 0,
      backgroundColor: 'white',
      anchorSkew: true,
      anchorSize: new window.naver.maps.Size(12, 12),
    });

    infoWindow.open(map, marker);

    window.naver.maps.Event.addListener(marker, 'click', () => {
      if (infoWindow.getMap()) {
        infoWindow.close();
      } else {
        infoWindow.open(map, marker);
      }
    });
  }, [lat, lng, zoom, markerTitle]);

  // 스크립트 로딩
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

    if (!clientId) {
      console.error('[NaverMap] NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수 미설정');
      setError('Client ID 미설정');
      return;
    }

    // 인증 실패 콜백 등록 (NCP 도메인 불일치 등)
    window.navermap_authFailure = () => {
      console.error(
        '[NaverMap] 네이버 지도 인증 실패!\n' +
        '→ NCP 콘솔(https://console.ncloud.com)에서 Web Service URL에 현재 도메인 등록 필요\n' +
        '→ 현재 도메인: ' + window.location.origin
      );
      setError('인증 실패 - NCP 도메인 확인 필요');
    };

    // 이미 로드된 경우
    if (window.naver?.maps) {
      setIsLoaded(true);
      return;
    }

    // 이미 로딩 중인 경우 - 콜백 큐에 등록
    const existingScript = document.querySelector('script[src*="openapi.map.naver.com"]');
    if (existingScript) {
      if (!window.__naverMapCallbacks) {
        window.__naverMapCallbacks = [];
      }
      window.__naverMapCallbacks.push(() => setIsLoaded(true));

      // 폴백: 이미 로드 완료되었을 수 있으므로 체크
      const checkLoaded = setInterval(() => {
        if (window.naver?.maps) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.naver?.maps) {
          console.error('[NaverMap] 스크립트 로딩 타임아웃 (10초)');
          setError('스크립트 로딩 타임아웃');
        }
      }, 10000);

      return () => {
        clearInterval(checkLoaded);
        clearTimeout(timeout);
      };
    }

    // 새로 로드
    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;

    script.onload = () => {
      // SDK가 실제로 준비되었는지 확인
      if (window.naver?.maps) {
        setIsLoaded(true);
        // 대기 중인 다른 컴포넌트들에게도 알림
        window.__naverMapCallbacks?.forEach(cb => cb());
        window.__naverMapCallbacks = [];
      } else {
        // SDK 초기화 대기 (드문 경우)
        const waitReady = setInterval(() => {
          if (window.naver?.maps) {
            setIsLoaded(true);
            window.__naverMapCallbacks?.forEach(cb => cb());
            window.__naverMapCallbacks = [];
            clearInterval(waitReady);
          }
        }, 50);

        setTimeout(() => {
          clearInterval(waitReady);
          if (!window.naver?.maps) {
            setError('SDK 초기화 실패');
          }
        }, 5000);
      }
    };

    script.onerror = () => {
      console.error('[NaverMap] 스크립트 로딩 실패 - 네트워크 또는 URL 확인');
      setError('스크립트 로딩 실패');
    };

    document.head.appendChild(script);
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.naver?.maps) return;
    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded, initMap]);

  if (error) {
    return (
      <div className={'flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20 ' + className}>
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-mono-light">지도를 불러올 수 없습니다</p>
          {typeof error === 'string' && (
            <p className="text-xs text-mono-light/60 mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20 z-10">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-primary/50 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-mono-light">지도 로딩 중...</p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%', minHeight: '200px' }}
      />
    </div>
  );
}
