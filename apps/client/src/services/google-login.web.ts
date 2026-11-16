import { AuthError, startGoogleAttempt } from './auth-api'

export async function signInWithGoogle() {
  const attempt = await startGoogleAttempt()
  if (attempt.platform !== 'web' || new URL(attempt.authorizationUrl).origin !== 'https://accounts.google.com') {
    throw new AuthError('GOOGLE_FAILED')
  }
  window.location.assign(attempt.authorizationUrl)
  return undefined
}
