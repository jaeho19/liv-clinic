'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface NaverMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
  markerTitle?: string;
  infoWindowText?: string;
}

declare global {
  interface Window {
    naver: typeof naver;
    navermap_authFailure?: () => void;
    __naverMapCallbacks?: Array<() => void>;
  }
}

/**
 * 네이버 지도 v3 SDK가 지원하는 언어는 ko / en / ja / zh 뿐이다.
 * (그 외 로케일은 en으로 — 한국어 타일이 뜨는 것보다 영문이 낫다)
 */
const NAVER_MAP_LANGUAGES: Partial<Record<string, string>> = {
  ko: 'ko',
  ja: 'ja',
  zh: 'zh',
  'zh-TW': 'zh',
};

function toNaverMapLanguage(locale: string): string {
  return NAVER_MAP_LANGUAGES[locale] ?? 'en';
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function NaverMap({
  lat,
  lng,
  zoom = 17,
  className = '',
  markerTitle,
  infoWindowText,
}: NaverMapProps) {
  const t = useTranslations('sections.location');
  const mapLanguage = toNaverMapLanguage(useLocale());
  const resolvedMarkerTitle = markerTitle ?? t('markerTitle');
  const resolvedInfoWindowText = infoWindowText ?? t('infoWindowSubway');
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
      title: resolvedMarkerTitle,
      animation: window.naver.maps.Animation.DROP,
    });

    const safeTitle = escapeHtml(resolvedMarkerTitle);
    const safeText = escapeHtml(resolvedInfoWindowText);
    const infoWindow = new window.naver.maps.InfoWindow({
      content: `<div style="padding: 12px 16px; min-width: 180px;"><h4 style="margin: 0 0 4px 0; font-weight: 600; color: #6d4e42;">${safeTitle}</h4><p style="margin: 0; font-size: 13px; color: #575756;">${safeText}</p></div>`,
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
  }, [lat, lng, zoom, resolvedMarkerTitle, resolvedInfoWindowText]);

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
    let mounted = true;
    let waitReadyId: ReturnType<typeof setInterval> | undefined;
    let sdkTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const script = document.createElement('script');
    // language: 지도 타일/컨트롤의 표기 언어. SDK는 문서 전체에 싱글턴으로 한 번만
    // 주입되므로 "페이지 로드 시점의 로케일"로 고정된다. 이 앱에서 로케일 전환은
    // 하드 내비게이션이라 실사용상 문제는 없다(전환 = 새 문서 = 새 SDK 로드).
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&language=${mapLanguage}`;
    script.async = true;

    // 전체 로딩 타임아웃 — onload/onerror가 모두 발화하지 않는 경우(네트워크 행, 광고차단 등)
    // "지도 로딩 중..." 무한 상태 방지
    const loadTimeout = setTimeout(() => {
      if (mounted && !window.naver?.maps) {
        console.error('[NaverMap] 스크립트 로딩 타임아웃 (10초)');
        setError('스크립트 로딩 타임아웃');
      }
    }, 10000);

    script.onload = () => {
      clearTimeout(loadTimeout);
      // SDK가 실제로 준비되었는지 확인
      if (window.naver?.maps) {
        if (mounted) setIsLoaded(true);
        // 대기 중인 다른 컴포넌트들에게도 알림
        window.__naverMapCallbacks?.forEach(cb => cb());
        window.__naverMapCallbacks = [];
      } else {
        // SDK 초기화 대기 (드문 경우)
        waitReadyId = setInterval(() => {
          if (window.naver?.maps) {
            if (mounted) setIsLoaded(true);
            window.__naverMapCallbacks?.forEach(cb => cb());
            window.__naverMapCallbacks = [];
            if (waitReadyId) clearInterval(waitReadyId);
          }
        }, 50);

        sdkTimeoutId = setTimeout(() => {
          if (waitReadyId) clearInterval(waitReadyId);
          if (mounted && !window.naver?.maps) {
            setError('SDK 초기화 실패');
          }
        }, 5000);
      }
    };

    script.onerror = () => {
      clearTimeout(loadTimeout);
      console.error('[NaverMap] 스크립트 로딩 실패 - 네트워크 또는 URL 확인');
      if (mounted) setError('스크립트 로딩 실패');
    };

    document.head.appendChild(script);

    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
      if (waitReadyId) clearInterval(waitReadyId);
      if (sdkTimeoutId) clearTimeout(sdkTimeoutId);
    };
  }, [mapLanguage]);

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
          <p className="text-mono-light">{t('mapError')}</p>
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
            <p className="text-mono-light">{t('mapLoading')}</p>
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
