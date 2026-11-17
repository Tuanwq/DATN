import { z } from 'zod'

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email())
export const MAX_PASSWORD_LENGTH = 1024
export const passwordLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
})

export const authPlatformSchema = z.enum(['web', 'android'])
export const loginRequestSchema = passwordLoginSchema.extend({ platform: authPlatformSchema })
export const MIN_REGISTRATION_PASSWORD_LENGTH = 15
export const passwordRegistrationSchema = z.object({
  email: emailSchema,
  password: z.string().max(MAX_PASSWORD_LENGTH)
    .refine((password) => password.trim().length > 0 && [...password].length >= MIN_REGISTRATION_PASSWORD_LENGTH),
  passwordConfirmation: z.string().max(MAX_PASSWORD_LENGTH),
}).refine(({ password, passwordConfirmation }) => password === passwordConfirmation, {
  path: ['passwordConfirmation'],
})
export const registrationRequestSchema = passwordRegistrationSchema.safeExtend({
  platform: authPlatformSchema,
})

export function registrationErrorCode(issues: readonly { path: readonly PropertyKey[] }[]) {
  switch (issues[0]?.path[0]) {
    case 'email': return 'INVALID_EMAIL'
    case 'password': return 'INVALID_PASSWORD'
    case 'passwordConfirmation': return 'PASSWORD_MISMATCH'
    default: return 'INVALID_REQUEST'
  }
}

export const googleAuthIntentSchema = z.enum(['login', 'register'])
export const googleAttemptRequestSchema = z.object({
  platform: authPlatformSchema,
  intent: googleAuthIntentSchema.default('login'),
})
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
  'GOOGLE_CANCELLED', 'GOOGLE_FAILED', 'GOOGLE_NOT_LINKED', 'GOOGLE_EMAIL_UNVERIFIED',
  'EMAIL_ALREADY_REGISTERED',
])
export const authErrorCodeSchema = z.enum([
  'INVALID_REQUEST', 'INVALID_CREDENTIALS', 'UNAUTHENTICATED', 'FORBIDDEN',
  'INVALID_EMAIL', 'INVALID_PASSWORD', 'PASSWORD_MISMATCH', 'EMAIL_ALREADY_REGISTERED',
  'RATE_LIMITED', 'GOOGLE_UNAVAILABLE', 'GOOGLE_FAILED', 'GOOGLE_NOT_LINKED',
  'GOOGLE_CANCELLED', 'GOOGLE_EMAIL_UNVERIFIED', 'SERVER_ERROR',
])
export const authErrorResponseSchema = z.object({ error: authErrorCodeSchema })

export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>
export type AuthPlatform = z.infer<typeof authPlatformSchema>
export type AuthSession = z.infer<typeof authSessionSchema>
export type GoogleCallbackResult = z.infer<typeof googleCallbackResultSchema>
export type GoogleAttemptResponse = z.infer<typeof googleAttemptResponseSchema>
export type GoogleAuthIntent = z.infer<typeof googleAuthIntentSchema>
export type PasswordLogin = z.infer<typeof passwordLoginSchema>
export type PasswordRegistration = z.infer<typeof passwordRegistrationSchema>
