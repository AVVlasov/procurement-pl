import { decodeJWT, isTokenExpired, getTokenExpirationTime, isTokenExpiringSoon, type JWTPayload } from '../jwt'

describe('JWT Utils', () => {
  const createMockToken = (expiresIn: number = 3600): string => {
    const now = Math.floor(Date.now() / 1000)
    const payload: JWTPayload = {
      userId: '123456',
      email: 'test@example.com',
      iat: now,
      exp: now + expiresIn,
    }
    
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payloadB64 = btoa(JSON.stringify(payload))
    const signature = btoa('signature')
    
    return `${header}.${payloadB64}.${signature}`
  }

  describe('decodeJWT', () => {
    test('should decode valid JWT token', () => {
      const token = createMockToken()
      const decoded = decodeJWT(token)
      
      expect(decoded).not.toBeNull()
      expect(decoded?.userId).toBe('123456')
      expect(decoded?.email).toBe('test@example.com')
    })

    test('should return null for invalid JWT format (too few parts)', () => {
      const token = 'invalid.token'
      const decoded = decodeJWT(token)
      
      expect(decoded).toBeNull()
    })

    test('should return null for invalid JWT format (too many parts)', () => {
      const token = 'part1.part2.part3.part4'
      const decoded = decodeJWT(token)
      
      expect(decoded).toBeNull()
    })

    test('should return null for invalid base64 encoding', () => {
      const token = 'header.!!!invalid!!!.signature'
      const decoded = decodeJWT(token)
      
      expect(decoded).toBeNull()
    })

    test('should return null for invalid JSON payload', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256' }))
      const invalidPayload = btoa('not json')
      const signature = btoa('sig')
      
      const token = `${header}.${invalidPayload}.${signature}`
      const decoded = decodeJWT(token)
      
      expect(decoded).toBeNull()
    })

    test('should handle empty token', () => {
      const decoded = decodeJWT('')
      
      expect(decoded).toBeNull()
    })

    test('should extract all payload fields', () => {
      const token = createMockToken()
      const decoded = decodeJWT(token)
      
      expect(decoded).toHaveProperty('userId')
      expect(decoded).toHaveProperty('email')
      expect(decoded).toHaveProperty('iat')
      expect(decoded).toHaveProperty('exp')
    })
  })

  describe('isTokenExpired', () => {
    test('should return false for valid token', () => {
      const token = createMockToken(3600) // Valid for 1 hour
      const expired = isTokenExpired(token)
      
      expect(expired).toBe(false)
    })

    test('should return true for expired token', () => {
      const token = createMockToken(-3600) // Expired 1 hour ago
      const expired = isTokenExpired(token)
      
      expect(expired).toBe(true)
    })

    test('should return true for invalid token', () => {
      const expired = isTokenExpired('invalid.token')
      
      expect(expired).toBe(true)
    })

    test('should handle edge case of token expiring now', () => {
      const now = Math.floor(Date.now() / 1000)
      const header = btoa(JSON.stringify({ alg: 'HS256' }))
      const payload = btoa(JSON.stringify({
        userId: '123',
        email: 'test@test.com',
        iat: now,
        exp: now, // Expired exactly now
      }))
      const signature = btoa('sig')
      const token = `${header}.${payload}.${signature}`
      
      const expired = isTokenExpired(token)
      
      expect(expired).toBe(true)
    })

    test('should handle token expiring in 1 second', () => {
      const token = createMockToken(1)
      
      // Should not be expired yet
      expect(isTokenExpired(token)).toBe(false)
    })
  })

  describe('getTokenExpirationTime', () => {
    test('should return remaining time for valid token', () => {
      const token = createMockToken(3600)
      const remainingTime = getTokenExpirationTime(token)
      
      expect(remainingTime).toBeGreaterThan(3590)
      expect(remainingTime).toBeLessThanOrEqual(3600)
    })

    test('should return 0 for expired token', () => {
      const token = createMockToken(-3600)
      const remainingTime = getTokenExpirationTime(token)
      
      expect(remainingTime).toBe(0)
    })

    test('should return 0 for invalid token', () => {
      const remainingTime = getTokenExpirationTime('invalid.token')
      
      expect(remainingTime).toBe(0)
    })

    test('should return approximately the expiration duration', () => {
      const token = createMockToken(7200) // 2 hours
      const remainingTime = getTokenExpirationTime(token)
      
      expect(remainingTime).toBeGreaterThan(7190)
      expect(remainingTime).toBeLessThanOrEqual(7200)
    })

    test('should handle token expiring very soon', () => {
      const token = createMockToken(10)
      const remainingTime = getTokenExpirationTime(token)
      
      expect(remainingTime).toBeGreaterThan(0)
      expect(remainingTime).toBeLessThanOrEqual(10)
    })
  })

  describe('isTokenExpiringSoon', () => {
    test('should return true for token expiring soon (default threshold 5 min)', () => {
      const token = createMockToken(200) // 200 seconds = less than 5 minutes
      const expiringSoon = isTokenExpiringSoon(token)
      
      expect(expiringSoon).toBe(true)
    })

    test('should return false for token with plenty of time', () => {
      const token = createMockToken(600) // 10 minutes
      const expiringSoon = isTokenExpiringSoon(token)
      
      expect(expiringSoon).toBe(false)
    })

    test('should respect custom threshold', () => {
      const token = createMockToken(1200) // 20 minutes
      const expiringSoon = isTokenExpiringSoon(token, 900) // 15 min threshold
      
      expect(expiringSoon).toBe(false)
    })

    test('should return false for expired token', () => {
      const token = createMockToken(-3600)
      const expiringSoon = isTokenExpiringSoon(token)
      
      expect(expiringSoon).toBe(false)
    })

    test('should return true at threshold boundary', () => {
      const token = createMockToken(299) // Just under 5 minutes
      const expiringSoon = isTokenExpiringSoon(token)
      
      expect(expiringSoon).toBe(true)
    })

    test('should return false just above threshold', () => {
      const token = createMockToken(301) // Just over 5 minutes
      const expiringSoon = isTokenExpiringSoon(token)
      
      expect(expiringSoon).toBe(false)
    })

    test('should handle invalid token', () => {
      const expiringSoon = isTokenExpiringSoon('invalid.token')
      
      expect(expiringSoon).toBe(false)
    })

    test('should work with custom threshold at boundary', () => {
      const token = createMockToken(100)
      const expiringSoon = isTokenExpiringSoon(token, 100)
      
      expect(expiringSoon).toBe(false)
    })
  })

  describe('Integration scenarios', () => {
    test('should handle complete token lifecycle', () => {
      const token = createMockToken(3600)
      
      // Token should be valid
      expect(isTokenExpired(token)).toBe(false)
      
      // Should have remaining time
      const remainingTime = getTokenExpirationTime(token)
      expect(remainingTime).toBeGreaterThan(0)
      
      // Should not be expiring soon
      expect(isTokenExpiringSoon(token)).toBe(false)
      
      // Should be decodable
      const decoded = decodeJWT(token)
      expect(decoded).not.toBeNull()
    })

    test('should handle refresh scenario (token near expiration)', () => {
      const token = createMockToken(250) // Less than 5 minutes
      
      expect(isTokenExpired(token)).toBe(false)
      expect(isTokenExpiringSoon(token)).toBe(true)
      expect(getTokenExpirationTime(token)).toBeGreaterThan(0)
      expect(getTokenExpirationTime(token)).toBeLessThan(300)
    })

    test('should handle expired token scenario', () => {
      const token = createMockToken(-100)
      
      expect(isTokenExpired(token)).toBe(true)
      expect(getTokenExpirationTime(token)).toBe(0)
      expect(isTokenExpiringSoon(token)).toBe(false)
    })
  })
})
