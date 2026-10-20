/** Live calls run in the native app only (Daily's RN SDK); the web build shows a notice. */
import type { ViewStyle } from 'react-native';
import { initialCallState, type CallParticipant, type CallService } from './calls.types';

export * from './calls.types';
export const callsSupported = false;

export function createCallService(): CallService {
  const state = { ...initialCallState, status: 'error' as const, error: 'unsupported_platform' };
  return {
    join: async () => undefined,
    leave: async () => undefined,
    setMic: () => undefined,
    setCamera: () => undefined,
    send: () => undefined,
    subscribe: (l) => {
      l(state);
      return () => undefined;
    },
    onMessage: () => () => undefined,
    destroy: async () => undefined,
  };
}

export function CallVideo(_props: {
  participant: CallParticipant;
  style?: ViewStyle;
  mirror?: boolean;
}) {
  return null;
}
