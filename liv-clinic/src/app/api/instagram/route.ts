import { NextResponse } from 'next/server';

/**
 * Instagram Feed API Route (Instagram Graph API)
 *
 * 비즈니스/크리에이터 계정 전용
 *
 * 설정 방법:
 * 1. Facebook Developer 계정 생성: https://developers.facebook.com
 * 2. 새 앱 생성 (비즈니스 유형)
 * 3. Instagram Graph API 추가
 * 4. Facebook 페이지와 Instagram 비즈니스 계정 연결
 * 5. Access Token 생성 (필요 권한: instagram_basic, pages_show_list, pages_read_engagement)
 * 6. .env.local에 INSTAGRAM_ACCESS_TOKEN 추가
 *
 * 토큰은 60일마다 갱신 필요 (POST /api/instagram 호출)
 */

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  thumbnail_url?: string;
}

interface InstagramResponse {
  data: InstagramMedia[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

// 캐시 저장소 (서버 메모리)
let cache: {
  data: InstagramMedia[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

// 캐시 유효 시간: 1시간 (3600000ms)
const CACHE_DURATION = 60 * 60 * 1000;

export async function GET() {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID;

    if (!accessToken) {
      console.error('INSTAGRAM_ACCESS_TOKEN is not configured');
      return NextResponse.json(
        { error: 'Instagram API가 설정되지 않았습니다.', posts: [] },
        { status: 200 }
      );
    }

    // 캐시 확인
    const now = Date.now();
    if (cache.data && now - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(
        { posts: cache.data },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

    // Instagram Graph API 호출
    const fields = 'id,media_type,media_url,permalink,caption,timestamp,thumbnail_url';
    const limit = 12; // 더보기 기능을 위해 12개로 확장

    // Instagram Account ID가 있으면 Graph API 사용, 없으면 me/media 사용
    const baseUrl = instagramAccountId
      ? `https://graph.facebook.com/v18.0/${instagramAccountId}/media`
      : `https://graph.instagram.com/me/media`;

    const url = `${baseUrl}?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Instagram API error:', errorData);

      if (errorData.error?.code === 190) {
        return NextResponse.json(
          { error: '토큰이 만료되었습니다. 갱신이 필요합니다.', posts: [] },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'Instagram API 호출 실패', posts: [] },
        { status: 200 }
      );
    }

    const data: InstagramResponse = await response.json();

    // 비디오의 경우 thumbnail_url과 media_url 모두 유지
    const posts = data.data.map((item) => ({
      ...item,
      // VIDEO 타입은 그대로 유지 (컴포넌트에서 처리)
    }));

    // 캐시 업데이트
    cache = { data: posts, timestamp: now };

    return NextResponse.json(
      { posts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Instagram fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', posts: [] },
      { status: 200 }
    );
  }
}

// 토큰 갱신용 엔드포인트 (장기 토큰 갱신)
// 장기 토큰은 60일마다 갱신 필요
export async function POST() {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'INSTAGRAM_ACCESS_TOKEN is not configured' },
        { status: 500 }
      );
    }

    // 장기 토큰 갱신 API 호출
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token refresh error:', errorData);
      return NextResponse.json(
        { error: 'Token refresh failed', details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();

    // 보안: 갱신된 access_token을 HTTP 응답으로 노출하지 않는다.
    // 새 토큰은 서버 로그에서 확인해 환경변수(INSTAGRAM_ACCESS_TOKEN)를 업데이트한다.
    console.log(
      '[instagram] access token refreshed — update env INSTAGRAM_ACCESS_TOKEN. token:',
      data.access_token,
      'expires_in(s):',
      data.expires_in
    );

    return NextResponse.json({
      success: true,
      message: '토큰이 갱신되었습니다. 서버 로그에서 새 토큰을 확인해 환경변수를 업데이트하세요.',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Server error during token refresh' },
      { status: 500 }
    );
  }
}
