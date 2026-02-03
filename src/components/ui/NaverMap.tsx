'use client';

import { useEffect, useRef, useState } from 'react';

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
    naverMapCallback?: () => void;
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

    if (!clientId) {
      console.error('Naver Map Client ID is not configured');
      setError(true);
      return;
    }

    // Check if script already loaded
    if (window.naver && window.naver.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="openapi.map.naver.com"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.naver && window.naver.maps) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Load Naver Maps script
    const script = document.createElement('script');
    script.src = 'https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=' + clientId;
    script.async = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Naver Maps script');
      setError(true);
    };

    document.head.appendChild(script);

    return () => {};
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.naver) return;

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

  }, [isLoaded, lat, lng, zoom, markerTitle]);

  if (error) {
    return (
      <div className={'flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20 ' + className}>
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-mono-light">지도를 불러올 수 없습니다</p>
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
        className="w-full h-full"
      />
    </div>
  );
}
