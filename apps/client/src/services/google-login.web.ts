import type { GoogleAuthIntent } from '@so-tien/shared/auth'
import { AuthError, startGoogleAttempt } from './auth-api'

export async function signInWithGoogle(intent: GoogleAuthIntent) {
  const attempt = await startGoogleAttempt(intent)
  if (attempt.platform !== 'web' || new URL(attempt.authorizationUrl).origin !== 'https://accounts.google.com') {
    throw new AuthError('GOOGLE_FAILED')
  }
  window.location.assign(attempt.authorizationUrl)
  return undefined
}
