import * as SecureStore from 'expo-secure-store'

const SESSION_KEY = 'so-tien-session'

export function readToken() {
  return SecureStore.getItemAsync(SESSION_KEY)
}

export function storeToken(token: string) {
  return SecureStore.setItemAsync(SESSION_KEY, token)
}

export function clearToken() {
  return SecureStore.deleteItemAsync(SESSION_KEY)
}
