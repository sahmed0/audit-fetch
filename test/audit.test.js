import { describe, it, mock, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { runAudit } from '../src/audit.js'
import { getAuditResult } from '../src/index.js'

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

// Builds a fake fetch that returns the given headers and status code
function fakeFetch(headerObj = {}, status = 200) {
  return async () => ({ status, headers: new Headers(headerObj) })
}

const ALL_HEADERS = {
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'self'",
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'geolocation=()',
}

describe('getAuditResult', () => {
  afterEach(() => mock.restoreAll())

  it('returns the url that was passed in', async () => {
    mock.method(globalThis, 'fetch', fakeFetch())
    const result = await getAuditResult('https://example.com', { audit: { silent: true } })
    assert.equal(result.url, 'https://example.com')
  })

  it('returns the http status code from the response', async () => {
    mock.method(globalThis, 'fetch', fakeFetch({}, 404))
    const result = await getAuditResult('https://example.com', { audit: { silent: true } })
    assert.equal(result.status, 404)
  })

  it('returns grade A and score 6 when all headers are present', async () => {
    mock.method(globalThis, 'fetch', fakeFetch(ALL_HEADERS))
    const result = await getAuditResult('https://example.com', { audit: { silent: true } })
    assert.equal(result.grade, 'A')
    assert.equal(result.score, 6)
    assert.equal(result.total, 6)
  })

  it('returns grade F and score 0 when no headers are present', async () => {
    mock.method(globalThis, 'fetch', fakeFetch())
    const result = await getAuditResult('https://example.com', { audit: { silent: true } })
    assert.equal(result.grade, 'F')
    assert.equal(result.score, 0)
  })

  it('always returns results for all 6 headers', async () => {
    mock.method(globalThis, 'fetch', fakeFetch())
    const result = await getAuditResult('https://example.com', { audit: { silent: true } })
    assert.equal(result.results.length, 6)
  })

  it('result entries do not include the recommended field', async () => {
    mock.method(globalThis, 'fetch', fakeFetch(ALL_HEADERS))
    const result = await getAuditResult('https://example.com', { audit: { silent: true } })
    for (const entry of result.results) {
      assert.equal('recommended' in entry, false)
    }
  })

  it('result entries have exactly the expected keys', async () => {
    mock.method(globalThis, 'fetch', fakeFetch({ 'x-content-type-options': 'nosniff' }))
    const result = await getAuditResult('https://example.com', { audit: { silent: true } })
    const entry = result.results.find(r => r.name === 'x-content-type-options')
    assert.deepEqual(Object.keys(entry).sort(), ['description', 'display', 'name', 'status', 'value'])
  })

  it('result entry value is null for a missing header', async () => {
    mock.method(globalThis, 'fetch', fakeFetch())
    const result = await getAuditResult('https://example.com', { audit: { silent: true } })
    const entry = result.results.find(r => r.name === 'strict-transport-security')
    assert.equal(entry.value, null)
    assert.equal(entry.status, 'missing')
  })

  it('result entry value holds the actual header string when present', async () => {
    mock.method(globalThis, 'fetch', fakeFetch({ 'strict-transport-security': 'max-age=31536000' }))
    const result = await getAuditResult('https://example.com', { audit: { silent: true } })
    const entry = result.results.find(r => r.name === 'strict-transport-security')
    assert.equal(entry.value, 'max-age=31536000')
    assert.equal(entry.status, 'present')
  })
})