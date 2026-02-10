export type AnalyticsPeriod = '7d' | '30d' | '90d';

export interface GA4Overview {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export interface GA4DailyTrend {
  date: string;
  sessions: number;
  pageviews: number;
}

export interface GA4TopPage {
  path: string;
  pageviews: number;
  avgDuration: number;
}

export interface GA4Source {
  channel: string;
  sessions: number;
}

export interface GA4Device {
  device: string;
  sessions: number;
}

export interface GA4AnalyticsData {
  overview: GA4Overview;
  dailyTrend: GA4DailyTrend[];
  topPages: GA4TopPage[];
  sources: GA4Source[];
  devices: GA4Device[];
  period: AnalyticsPeriod;
  fetchedAt: string;
}
