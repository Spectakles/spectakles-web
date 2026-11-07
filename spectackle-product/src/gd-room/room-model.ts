import type { MicrophoneSnapshot } from '../gd-audio/microphone';
import type { DiscussionState } from '../gd-audio/useDiscussion';
import type { LiveSnapshot } from '../gd-audio/live';

export type RoomPerson = { id: string; name: string; role: string; color: string };
export type RoomPhase = DiscussionState['phase'];
export type ConnectionStatus = 'checking' | 'online' | 'offline';

const standardRoles: Record<string, string> = {
  'an analytical, skeptical B.Tech student who tests assumptions and asks for evidence': 'Skeptical analyst',
  'an enthusiastic, solution-focused B.Tech student who works through practical possibilities': 'Practical problem-solver',
  'a calm, precise B.Tech student who clarifies distinctions through concrete situations and relevant facts': 'Thoughtful clarifier',
};
export function displayRole(role: string) { return standardRoles[role] || role; }

export const phaseLabels: Record<RoomPhase, string> = {
  idle: 'Ready when you are', starting: 'Getting your microphone ready',
  preparing: 'Time to prepare', connecting: 'Your panel is joining',
  waiting: 'The floor is yours', discussion: 'Discussion in progress',
  closing: 'Bring your thoughts together', final_minute: 'Final thoughts',
  expired: 'Finishing the current turn', ending: 'Ending your discussion',
  ended: 'Discussion complete', error: 'Discussion stopped',
};

export function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function isRoundActive(phase: RoomPhase) {
  return !['idle', 'ended', 'error'].includes(phase);
}

export function isSpeaking(person: RoomPerson, microphone: MicrophoneSnapshot, live: LiveSnapshot, state: DiscussionState) {
  if (!['waiting', 'discussion', 'closing', 'final_minute', 'expired'].includes(state.phase)) return false;
  if (person.id === 'user') return microphone.speaking;
  return person.id === state.owner && live.phase === 'replying' && live.playback.phase === 'playing' && live.playback.played > 0;
}

export function personStatus(person: RoomPerson, microphone: MicrophoneSnapshot, live: LiveSnapshot, state: DiscussionState) {
  if (isSpeaking(person, microphone, live, state)) return 'Speaking';
  if (['ended', 'error'].includes(state.phase)) return 'Left the discussion';
  if (state.phase === 'ending') return 'Finishing up';
  if (person.id === 'user') return microphone.phase === 'listening' ? 'Microphone ready' : 'Your seat';
  if (state.phase === 'preparing') return 'Joining after preparation';
  if (state.phase === 'connecting') return 'Connecting…';
  return state.providers[person.id] ? 'Listening' : 'AI participant';
}
