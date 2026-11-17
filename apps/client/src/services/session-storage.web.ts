export async function readToken() {
  return null
}

export async function storeToken(_token: string) {
  throw new Error('Web sessions use an HttpOnly cookie')
}

export async function clearToken() {}
