import { describe, it, expect } from 'vitest';
import { resolveTarget } from '../slackRelay';

describe('resolveTarget', () => {
  it('room 모드 + 채널 → room', () => {
    expect(resolveTarget({ slack_mode: 'room', slack_channel_id: 'C9', slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'room',
      channelId: 'C9',
    });
  });
  it('room 선점만 되고 채널이 아직 없으면 unassigned (경합 폴링 대상)', () => {
    expect(resolveTarget({ slack_mode: 'room', slack_channel_id: null, slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'unassigned',
    });
  });
  it('thread 모드는 저장된 채널과 thread_ts를 쓴다', () => {
    expect(resolveTarget({ slack_mode: 'thread', slack_channel_id: 'C0OLD', slack_thread_ts: '1.0' }, 'C0FEED')).toEqual({
      mode: 'thread',
      channelId: 'C0OLD',
      threadTs: '1.0',
    });
  });
  it('thread 모드인데 채널이 비어 있으면 피드 채널', () => {
    expect(resolveTarget({ slack_mode: 'thread', slack_channel_id: null, slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'thread',
      channelId: 'C0FEED',
      threadTs: null,
    });
  });
  it('모드가 없으면 unassigned', () => {
    expect(resolveTarget({ slack_mode: null, slack_channel_id: null, slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'unassigned',
    });
  });
});
