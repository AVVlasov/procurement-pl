/**
 * JWT utility functions for token management
 */

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Decode JWT token without verification (for client-side use only)
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT format')
      return null
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]))
    return payload as JWTPayload
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token)
  if (!payload) {
    return true
  }

  // Check if expiration time is in the past
  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

/**
 * Get remaining time until token expiration (in seconds)
 */
export const getTokenExpirationTime = (token: string): number => {
  const payload = decodeJWT(token)
  if (!payload) {
    return 0
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const remainingTime = payload.exp - currentTime

  return remainingTime > 0 ? remainingTime : 0
}

/**
 * Check if token will expire soon (within 5 minutes)
 */
export const isTokenExpiringSoon = (token: string, thresholdSeconds: number = 300): boolean => {
  const remainingTime = getTokenExpirationTime(token)
  return remainingTime < thresholdSeconds && remainingTime > 0
}
