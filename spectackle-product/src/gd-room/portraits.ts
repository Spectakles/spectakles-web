// Curated, fictional adults generated for Spectakles. Unknown/custom panelists
// retain initials until an institution explicitly chooses a catalogue avatar.
const portraits = new Map([
  ['arjun', '/gd-avatars/arjun-v3.jpg'],
  ['sahil', '/gd-avatars/sahil-v3.jpg'],
  ['meera', '/gd-avatars/meera-v3.jpg'],
  ['nina', '/gd-avatars/nina-v1.jpg'],
  ['rohan', '/gd-avatars/rohan-v1.jpg'],
]);

export function portraitFor(participantId: string): string | undefined {
  return portraits.get(participantId);
}
