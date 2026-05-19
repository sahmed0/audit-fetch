import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runAudit } from '../src/audit.js'

// Helper to create a mock Headers object from a plain object
function mockHeaders(obj) {
  return new Headers(obj)
}

describe('runAudit', () => {

  describe('scoring', () => {
    it('returns a score of 0 when no security headers are present', () => {
      const headers = mockHeaders({})
      const result = runAudit(headers)
      assert.equal(result.score, 0)
    })

    it('returns a perfect score when all security headers are present', () => {
      const headers = mockHeaders({
        'strict-transport-security': 'max-age=31536000',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'content-security-policy': "default-src 'self'",
        'referrer-policy': 'no-referrer',
        'permissions-policy': 'geolocation=()',
      })
      const result = runAudit(headers)
      assert.equal(result.score, 6)
    })

    it('returns a partial score when some headers are present', () => {
      const headers = mockHeaders({
        'strict-transport-security': 'max-age=31536000',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
      })
      const result = runAudit(headers)
      assert.equal(result.score, 3)
    })

    it('does not count a misconfigured header in the score', () => {
      const headers = mockHeaders({
        'x-content-type-options': 'invalid-value',
      })
      const result = runAudit(headers)
      assert.equal(result.score, 0)
    })
  })

  describe('grading', () => {
    it('returns grade A for a perfect score', () => {
      const headers = mockHeaders({
        'strict-transport-security': 'max-age=31536000',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'content-security-policy': "default-src 'self'",
        'referrer-policy': 'no-referrer',
        'permissions-policy': 'geolocation=()',
      })
      const result = runAudit(headers)
      assert.equal(result.grade, 'A')
    })

    it('returns grade F for a score of 0', () => {
      const headers = mockHeaders({})
      const result = runAudit(headers)
      assert.equal(result.grade, 'F')
    })

    it('returns grade C for a score of 3', () => {
      const headers = mockHeaders({
        'strict-transport-security': 'max-age=31536000',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
      })
      const result = runAudit(headers)
      assert.equal(result.grade, 'C')
    })
  })

  describe('header statuses', () => {
    it('marks a present and valid header as present', () => {
      const headers = mockHeaders({
        'x-content-type-options': 'nosniff',
      })
      const result = runAudit(headers)
      const header = result.results.find(r => r.name === 'x-content-type-options')
      assert.equal(header.status, 'present')
    })

    it('marks a missing header as missing', () => {
      const headers = mockHeaders({})
      const result = runAudit(headers)
      const header = result.results.find(r => r.name === 'x-frame-options')
      assert.equal(header.status, 'missing')
    })

    it('marks a header with an invalid value as misconfigured', () => {
      const headers = mockHeaders({
        'x-content-type-options': 'invalid-value',
      })
      const result = runAudit(headers)
      const header = result.results.find(r => r.name === 'x-content-type-options')
      assert.equal(header.status, 'misconfigured')
    })

    it('accepts both DENY and SAMEORIGIN as valid x-frame-options values', () => {
      const denyHeaders = mockHeaders({ 'x-frame-options': 'DENY' })
      const sameOriginHeaders = mockHeaders({ 'x-frame-options': 'SAMEORIGIN' })

      const denyResult = runAudit(denyHeaders)
      const sameOriginResult = runAudit(sameOriginHeaders)

      const denyHeader = denyResult.results.find(r => r.name === 'x-frame-options')
      const sameOriginHeader = sameOriginResult.results.find(r => r.name === 'x-frame-options')

      assert.equal(denyHeader.status, 'present')
      assert.equal(sameOriginHeader.status, 'present')
    })
  })

  describe('result structure', () => {
    it('always returns results for all 6 headers', () => {
      const headers = mockHeaders({})
      const result = runAudit(headers)
      assert.equal(result.results.length, 6)
    })

    it('always returns a total of 6', () => {
      const headers = mockHeaders({})
      const result = runAudit(headers)
      assert.equal(result.total, 6)
    })
  })

})