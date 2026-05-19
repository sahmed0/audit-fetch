# audit-fetch

A drop-in replacement for `fetch` that audits HTTP security response headers and prints a colour-coded report to your terminal.

```js
const response = await auditFetch('https://api.example.com')
```

```
┌──────────────────────────────────────────────────────┐
│  auditFetch — Security Report                        │
│  GET https://api.example.com                         │
│  Score: 3/6  Grade: C  [██████████░░░░░░░░░░]        │
├──────────────────────────────────────────────────────┤
│ ✅     Strict-Transport-Security        present     │
│ ✅     X-Content-Type-Options           present     │
│ ✅     X-Frame-Options                  present     │
│ ⚠️     Content-Security-Policy          missing     │
│ ⚠️     Referrer-Policy                  missing     │
│ ⚠️     Permissions-Policy               missing     │ 
└──────────────────────────────────────────────────────┘
```

## Features

- ✅ Drop-in replacement for native `fetch` — no changes to your existing code
- 🛡️ Audits 6 key security response headers
- 🎨 Colour-coded terminal report with score, grade, and progress bar
- 🔇 Silent mode for production environments
- 🚨 Optional `failOn` threshold to hard-fail in CI/CD pipelines
- 📦 Single peer dependency (`chalk`)

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

`auditFetch` returns the original `Response` object untouched — use it exactly like `fetch`.

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

### `failOn` threshold

Throw an error if the security grade falls below a required level.
Useful for CI/CD pipelines and integration tests:

```js
// Throws if the API scores below a B
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
| D | 1–2/6 |
| F | 0/6 |

## API Reference

### `auditFetch(url, options?)`

| Parameter | Type | Description |
|---|---|---|
| `url` | `string` | The URL to fetch |
| `options` | `object` | All standard `fetch` options, plus `audit` |
| `options.audit.silent` | `boolean` | Suppress terminal output. Default: `false` |
| `options.audit.failOn` | `string` | Grade threshold to throw an error (`'A'`–`'F'`). Default: `null` |

**Returns:** `Promise<Response>` — identical to native `fetch`

## Requirements

- Node.js 18 or higher (for native `fetch` support)

## License
MIT - 2026 Sajid Ahmed