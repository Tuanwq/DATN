import { z } from 'zod'

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email())
export const passwordLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(1024),
})

export const authPlatformSchema = z.enum(['web', 'android'])
export const loginRequestSchema = passwordLoginSchema.extend({ platform: authPlatformSchema })
export const googleAttemptRequestSchema = z.object({ platform: authPlatformSchema })
export const authTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)
export const googleLoginRequestSchema = z.object({
  attempt: authTokenSchema,
  idToken: z.string().min(1).max(8192),
})

export const authSessionSchema = z.object({
  user: z.object({ id: z.uuid(), email: emailSchema }),
  expiresAt: z.iso.datetime(),
})
export const loginResponseSchema = authSessionSchema.extend({ token: authTokenSchema.optional() })
export const googleAttemptResponseSchema = z.discriminatedUnion('platform', [
  z.object({ platform: z.literal('web'), authorizationUrl: z.url() }),
  z.object({
    platform: z.literal('android'),
    attempt: authTokenSchema,
    nonce: z.string().regex(/^[a-f0-9]{64}$/),
    clientId: z.string().min(1),
  }),
])

export const googleCallbackResultSchema = z.enum([
  'GOOGLE_CANCELLED', 'GOOGLE_FAILED', 'GOOGLE_NOT_LINKED',
])
export const authErrorCodeSchema = z.enum([
  'INVALID_REQUEST', 'INVALID_CREDENTIALS', 'UNAUTHENTICATED', 'FORBIDDEN',
  'RATE_LIMITED', 'GOOGLE_UNAVAILABLE', 'GOOGLE_FAILED', 'GOOGLE_NOT_LINKED',
  'GOOGLE_CANCELLED', 'SERVER_ERROR',
])
export const authErrorResponseSchema = z.object({ error: authErrorCodeSchema })

export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>
export type AuthPlatform = z.infer<typeof authPlatformSchema>
export type AuthSession = z.infer<typeof authSessionSchema>
export type GoogleCallbackResult = z.infer<typeof googleCallbackResultSchema>
export type GoogleAttemptResponse = z.infer<typeof googleAttemptResponseSchema>
export type PasswordLogin = z.infer<typeof passwordLoginSchema>
