import { getGA4Client, getGA4PropertyId } from './ga4-client';
import type {
  AnalyticsPeriod,
  GA4AnalyticsData,
  GA4Overview,
  GA4DailyTrend,
  GA4TopPage,
  GA4Source,
  GA4Device,
} from '@/types/analytics';

function periodToDays(period: AnalyticsPeriod): string {
  switch (period) {
    case '7d': return '7daysAgo';
    case '30d': return '30daysAgo';
    case '90d': return '90daysAgo';
  }
}

async function fetchOverview(propertyId: string, startDate: string): Promise<GA4Overview> {
  const client = getGA4Client();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate: 'today' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
    ],
  });

  const row = response.rows?.[0];
  const vals = row?.metricValues || [];

  return {
    sessions: Number(vals[0]?.value || 0),
    users: Number(vals[1]?.value || 0),
    pageviews: Number(vals[2]?.value || 0),
    bounceRate: Number(Number(vals[3]?.value || 0).toFixed(2)),
    avgSessionDuration: Number(Number(vals[4]?.value || 0).toFixed(1)),
  };
}

async function fetchDailyTrend(propertyId: string, startDate: string): Promise<GA4DailyTrend[]> {
  const client = getGA4Client();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'screenPageViews' },
    ],
    orderBys: [{ dimension: { dimensionName: 'date', orderType: 'ALPHANUMERIC' } }],
  });

  return (response.rows || []).map((row) => ({
    date: row.dimensionValues?.[0]?.value || '',
    sessions: Number(row.metricValues?.[0]?.value || 0),
    pageviews: Number(row.metricValues?.[1]?.value || 0),
  }));
}

async function fetchTopPages(propertyId: string, startDate: string): Promise<GA4TopPage[]> {
  const client = getGA4Client();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });

  return (response.rows || []).map((row) => ({
    path: row.dimensionValues?.[0]?.value || '',
    pageviews: Number(row.metricValues?.[0]?.value || 0),
    avgDuration: Number(Number(row.metricValues?.[1]?.value || 0).toFixed(1)),
  }));
}

async function fetchSources(propertyId: string, startDate: string): Promise<GA4Source[]> {
  const client = getGA4Client();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  });

  return (response.rows || []).map((row) => ({
    channel: row.dimensionValues?.[0]?.value || 'Unknown',
    sessions: Number(row.metricValues?.[0]?.value || 0),
  }));
}

async function fetchDevices(propertyId: string, startDate: string): Promise<GA4Device[]> {
  const client = getGA4Client();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate: 'today' }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  });

  return (response.rows || []).map((row) => ({
    device: row.dimensionValues?.[0]?.value || 'Unknown',
    sessions: Number(row.metricValues?.[0]?.value || 0),
  }));
}

export async function fetchGA4Analytics(period: AnalyticsPeriod): Promise<GA4AnalyticsData> {
  const propertyId = getGA4PropertyId();
  const startDate = periodToDays(period);

  const [overview, dailyTrend, topPages, sources, devices] = await Promise.all([
    fetchOverview(propertyId, startDate),
    fetchDailyTrend(propertyId, startDate),
    fetchTopPages(propertyId, startDate),
    fetchSources(propertyId, startDate),
    fetchDevices(propertyId, startDate),
  ]);

  return {
    overview,
    dailyTrend,
    topPages,
    sources,
    devices,
    period,
    fetchedAt: new Date().toISOString(),
  };
}
