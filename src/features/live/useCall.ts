import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Camera } from 'expo-camera';
import {
  createCallService,
  initialCallState,
  type CallService,
  type CallState,
} from '@/services/calls';
import { fetchCallCredentials } from './api';

export interface CallControls {
  setMic: (on: boolean) => void;
  setCamera: (on: boolean) => void;
  send: (data: unknown) => void;
  leave: () => Promise<void>;
}

/** Fetches credentials, asks for camera/mic permission, joins, and tears down on unmount. */
export function useCall(bookingId: string, enabled: boolean, onMessage?: (data: unknown) => void) {
  const service = useRef<CallService | null>(null);
  const handler = useRef(onMessage);
  const [state, setState] = useState<CallState>(initialCallState);
  const [joinError, setJoinError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [joinedAt, setJoinedAt] = useState<number | null>(null);

  useEffect(() => {
    handler.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const svc = createCallService();
    service.current = svc;
    const unsubscribe = svc.subscribe((s) => {
      if (cancelled) return;
      setState(s);
      if (s.status === 'joined') setJoinedAt((t) => t ?? Date.now());
    });
    const unlisten = svc.onMessage((d) => handler.current?.(d));

    (async () => {
      try {
        if (Platform.OS === 'web')
          throw Object.assign(new Error('unsupported'), { code: 'unsupported' });
        const mic = await Camera.requestMicrophonePermissionsAsync();
        if (!mic.granted) throw Object.assign(new Error('permissions'), { code: 'permissions' });
        const cam = await Camera.requestCameraPermissionsAsync();
        if (!cam.granted) svc.setCamera(false);
        const creds = await fetchCallCredentials(bookingId);
        if (!cancelled) await svc.join(creds.url, creds.token);
      } catch (e) {
        if (!cancelled) setJoinError((e as { code?: string }).code ?? 'call_failed');
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
      unlisten();
      void svc.destroy();
      service.current = null;
    };
  }, [bookingId, enabled, attempt]);

  const controls = useMemo<CallControls>(
    () => ({
      setMic: (on) => service.current?.setMic(on),
      setCamera: (on) => service.current?.setCamera(on),
      send: (data) => service.current?.send(data),
      leave: async () => {
        await service.current?.leave();
      },
    }),
    [],
  );

  const retry = () => {
    setJoinError(undefined);
    setAttempt((a) => a + 1);
  };

  return { state, joinError, retry, controls, joinedAt };
}
