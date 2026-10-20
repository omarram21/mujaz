/**
 * The only module that knows about the video provider (Daily). Swap providers by
 * re-implementing `createCallService` and `CallVideo` against calls.types.ts.
 */
import type { ViewStyle } from 'react-native';
import Daily, {
  DailyMediaView,
  type DailyCall,
  type DailyParticipant,
} from '@daily-co/react-native-daily-js';
import {
  initialCallState,
  type CallParticipant,
  type CallService,
  type CallState,
} from './calls.types';

export * from './calls.types';
export const callsSupported = true;

function toParticipant(p: DailyParticipant): CallParticipant {
  const video = p.tracks.video;
  const audio = p.tracks.audio;
  return {
    id: p.session_id,
    userId: p.user_id,
    name: p.user_name,
    isLocal: p.local,
    isOwner: p.owner,
    audioOn: audio.state === 'playable' || audio.state === 'sendable' || audio.state === 'loading',
    videoOn: video.state === 'playable' || video.state === 'sendable' || video.state === 'loading',
    videoTrack: video.persistentTrack ?? null,
    audioTrack: audio.persistentTrack ?? null,
  };
}

export function createCallService(): CallService {
  let call: DailyCall | null = Daily.createCallObject();
  let state: CallState = initialCallState;
  const listeners = new Set<(s: CallState) => void>();
  const messageListeners = new Set<(d: unknown) => void>();

  const emit = (patch: Partial<CallState>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l(state));
  };
  const refresh = () => {
    if (!call) return;
    emit({ participants: Object.values(call.participants()).map(toParticipant) });
  };

  call
    .on('joined-meeting', () => {
      emit({ status: 'joined' });
      refresh();
    })
    .on('participant-joined', refresh)
    .on('participant-updated', refresh)
    .on('participant-left', refresh)
    .on('track-started', refresh)
    .on('track-stopped', refresh)
    .on('active-speaker-change', (e) => emit({ activeSpeakerId: e?.activeSpeaker?.peerId ?? null }))
    .on('left-meeting', () => emit({ status: 'left' }))
    .on('error', (e) => emit({ status: 'error', error: e?.errorMsg ?? 'call_error' }))
    .on('app-message', (e) => messageListeners.forEach((l) => l(e?.data)));

  return {
    async join(url, token) {
      if (!call) return;
      emit({ status: 'joining', error: undefined });
      try {
        await call.join({ url, token, startAudioOff: false, startVideoOff: false });
      } catch (e) {
        emit({ status: 'error', error: e instanceof Error ? e.message : 'join_failed' });
      }
    },
    async leave() {
      await call?.leave();
    },
    setMic(on) {
      call?.setLocalAudio(on);
    },
    setCamera(on) {
      call?.setLocalVideo(on);
    },
    send(data) {
      call?.sendAppMessage(data, '*');
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    onMessage(listener) {
      messageListeners.add(listener);
      return () => messageListeners.delete(listener);
    },
    async destroy() {
      const c = call;
      call = null;
      listeners.clear();
      messageListeners.clear();
      if (c) {
        try {
          await c.leave();
        } finally {
          await c.destroy();
        }
      }
    },
  };
}

export function CallVideo({
  participant,
  style,
  mirror,
}: {
  participant: CallParticipant;
  style?: ViewStyle;
  mirror?: boolean;
}) {
  return (
    <DailyMediaView
      // Track handles come from this module's own toParticipant(), so the cast is safe.
      videoTrack={
        (participant.videoTrack ?? null) as React.ComponentProps<
          typeof DailyMediaView
        >['videoTrack']
      }
      audioTrack={
        (participant.isLocal ? null : (participant.audioTrack ?? null)) as React.ComponentProps<
          typeof DailyMediaView
        >['audioTrack']
      }
      mirror={mirror}
      objectFit="cover"
      zOrder={participant.isLocal ? 1 : 0}
      style={style}
    />
  );
}
