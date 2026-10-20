/** Provider-neutral call API used by the live session screens. */
export interface CallParticipant {
  id: string;
  userId: string;
  name: string;
  isLocal: boolean;
  isOwner: boolean;
  audioOn: boolean;
  videoOn: boolean;
  /** Opaque track handles, only meaningful to <CallVideo/> from the same provider. */
  videoTrack: unknown;
  audioTrack: unknown;
}

export type CallStatus = 'idle' | 'joining' | 'joined' | 'left' | 'error';

export interface CallState {
  status: CallStatus;
  participants: CallParticipant[];
  activeSpeakerId: string | null;
  error?: string;
}

export interface CallService {
  join(url: string, token: string): Promise<void>;
  leave(): Promise<void>;
  setMic(on: boolean): void;
  setCamera(on: boolean): void;
  /** Broadcast a small JSON message to the other participant (e.g. reading position). */
  send(data: unknown): void;
  subscribe(listener: (state: CallState) => void): () => void;
  onMessage(listener: (data: unknown) => void): () => void;
  destroy(): Promise<void>;
}

export const initialCallState: CallState = {
  status: 'idle',
  participants: [],
  activeSpeakerId: null,
};
