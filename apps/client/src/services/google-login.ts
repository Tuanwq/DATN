import type { GoogleAuthIntent } from '@so-tien/shared/auth'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { AuthError, loginWithGoogleToken, startGoogleAttempt } from './auth-api'

export async function signInWithGoogle(intent: GoogleAuthIntent) {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new AuthError('GOOGLE_UNAVAILABLE')
  }
  const attempt = await startGoogleAttempt(intent)
  if (attempt.platform !== 'android') throw new AuthError('GOOGLE_FAILED')

  const {
    GoogleOneTapSignIn, isCancelledResponse, isErrorWithCode, isSuccessResponse, statusCodes,
  } = await import('react-native-nitro-google-signin').catch(() => {
    throw new AuthError('GOOGLE_UNAVAILABLE')
  })
  let result
  try {
    GoogleOneTapSignIn.configure({ webClientId: attempt.clientId, nonce: attempt.nonce })
    await GoogleOneTapSignIn.checkPlayServices()
    result = await GoogleOneTapSignIn.presentExplicitSignIn()
  } catch (error) {
    const cancelled = isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED
    throw new AuthError(cancelled ? 'GOOGLE_CANCELLED' : 'GOOGLE_FAILED')
  }
  if (isCancelledResponse(result)) throw new AuthError('GOOGLE_CANCELLED')
  if (!isSuccessResponse(result) || !result.data.idToken) throw new AuthError('GOOGLE_FAILED')
  return loginWithGoogleToken(attempt.attempt, result.data.idToken)
}
