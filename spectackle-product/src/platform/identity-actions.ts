import { sendEmailVerification, sendPasswordResetEmail, type Auth, type User } from 'firebase/auth';

export function emailInput(value: string) {
  const email = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) throw new Error('Enter your account email address.');
  return email;
}
export async function requestReset(auth: Auth, value: string, send = sendPasswordResetEmail) {
  const email = emailInput(value);
  try { await send(auth, email); }
  catch (failure) {
    const code = (failure as { code?: string }).code;
    if (code !== 'auth/user-not-found') throw new Error(code === 'auth/too-many-requests' ? 'Too many requests. Wait a little before trying again.' : 'The reset email could not be requested. Please try again.');
  }
  return 'If an account exists for this email, a password-reset link has been requested. Check your inbox and spam folder.';
}
export async function requestVerification(user: User, send = sendEmailVerification) {
  if (!user.emailVerified) await send(user);
  return 'Verification email requested. Follow its link, then return here to refresh your status.';
}
export async function refreshVerification(user: User) {
  await user.reload();
  await user.getIdToken(true);
  return user.emailVerified;
}
