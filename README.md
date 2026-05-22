# audit-fetch

A drop-in replacement for `fetch` that audits HTTP security response headers and prints a colour-coded report to your terminal.


### Example

```js
import { auditFetch } from 'audit-fetch'

await auditFetch('https://github.com')
```
<p>
  <img src="https://github.com/sahmed0/audit-fetch/blob/main/demo.png?raw=true" alt="audit-fetch terminal output" width="600">
</p>

## Features

- ✅ Drop-in replacement for native `fetch` - no changes to your existing code
- 🛡️ Audits 6 key security response headers
- 🎨 Colour-coded terminal report with score, grade, and progress bar
- 🔇 Silent mode for production environments
- 🚨 Optional `failOn` threshold to hard-fail in CI/CD pipelines
- 📊 `getAuditResult` for structured audit data without the `Response` object
- 📦 Single dependency (`chalk`)

## Installation

```bash
npm install audit-fetch
```

## Usage

### Basic

```js
import { auditFetch } from 'audit-fetch'

const response = await auditFetch('https://api.example.com/data')
const data = await response.json()
```

`auditFetch` returns the original `Response` object untouched - use it exactly like `fetch`.

### With options

All standard `fetch` options work as normal:

```js
const response = await auditFetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 1 }),
})
```

### Silent mode

Suppress terminal output without disabling the audit:

```js
const response = await auditFetch('https://api.example.com', {
  audit: { silent: true }
})
```

### `getAuditResult`

Use `getAuditResult` when you want the structured audit data directly - for example, storing results in a database, returning them from an API, or running audits in a server context where terminal output isn't appropriate.

```js
import { getAuditResult } from 'audit-fetch'

const result = await getAuditResult('https://github.com', { audit: { silent: true } })
console.log(result)
```

```js
{
  url: 'https://github.com',
  status: 200,
  grade: 'B',
  score: 5,
  total: 6,
  results: [
    {
      name: 'strict-transport-security',
      display: 'Strict-Transport-Security',
      description: 'Forces HTTPS connections',
      status: 'present',
      value: 'max-age=31536000',
    },
    // ... one entry per header
  ]
}
```

`getAuditResult` accepts the same arguments as `auditFetch` (including all standard `fetch` options) and prints the terminal report by default - pass `audit: { silent: true }` to suppress it.

### `failOn` threshold

Throw an error if the security grade falls below a required level.
Useful for CI/CD pipelines and integration tests:

```js
// Throws if the API scores B or below (i.e. grade is not A)
const response = await auditFetch('https://api.example.com', {
  audit: { failOn: 'B' }
})
```

## Audited Headers

| Header | Why It Matters |
|---|---|
| `Strict-Transport-Security` | Forces HTTPS connections |
| `X-Content-Type-Options` | Prevents MIME sniffing attacks |
| `X-Frame-Options` | Prevents clickjacking |
| `Content-Security-Policy` | Controls what resources can load |
| `Referrer-Policy` | Controls referrer information leakage |
| `Permissions-Policy` | Restricts browser feature access |

## Grading Scale

| Grade | Score |
|---|---|
| A | 6/6 |
| B | 5/6 |
| C | 3–4/6 |
| D | 2/6 |
| F | 0–1/6 |

## API Reference

### `auditFetch(url, options?)`

| Parameter | Type | Description |
|---|---|---|
| `url` | `string` | The URL to fetch |
| `options` | `object` | All standard `fetch` options, plus `audit` |
| `options.audit.silent` | `boolean` | Suppress terminal output. Default: `false` |
| `options.audit.failOn` | `string` | Grade threshold to throw an error (`'A'`–`'F'`). Default: `null` |

**Returns:** `Promise<Response>` - identical to native `fetch`

---

### `getAuditResult(url, options?)`

| Parameter | Type | Description |
|---|---|---|
| `url` | `string` | The URL to fetch |
| `options` | `object` | All standard `fetch` options, plus `audit` |
| `options.audit.silent` | `boolean` | Suppress terminal output. Default: `false` |

**Returns:** `Promise<AuditResult>`

```ts
{
  url: string
  status: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
  total: number
  results: Array<{
    name: string
    display: string
    description: string
    status: 'present' | 'missing' | 'misconfigured'
    value: string | null
  }>
}
```

## Requirements

- Node.js 18 or higher (for native `fetch` support)

## License
MIT - 2026 Sajid Ahmed