import { auditFetch, getAuditResult } from '../src/index.js'

// Test 1 - basic usage against a real URL
console.log('Test 1: Basic usage')
const response = await auditFetch('https://httpbin.org/get')
console.log('Status:', response.status)

// Test 2 - silent mode, no terminal report printed
console.log('\nTest 2: Silent mode')
const silentResponse = await auditFetch('https://httpbin.org/get', {
  audit: { silent: true }
})
console.log('Silent response status:', silentResponse.status)

// Test 3 - POST request
console.log('\nTest 3: POST request')
await auditFetch('https://httpbin.org/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hello: 'world' }),
})

// Test 4 - getAuditResult returns structured data
console.log('\nTest 4: getAuditResult basic usage')
const auditResult = await getAuditResult('https://httpbin.org/get', { audit: { silent: true } })
console.log('url:', auditResult.url)
console.log('status:', auditResult.status)
console.log('grade:', auditResult.grade)
console.log('score:', auditResult.score, '/', auditResult.total)
console.log('results:', JSON.stringify(auditResult.results, null, 2))

// Test 5 - getAuditResult with silent: false prints the report
console.log('\nTest 5: getAuditResult with report printed')
await getAuditResult('https://httpbin.org/get')