// The checklist of security headers to audit
const SECURITY_HEADERS = [
  {
    name: 'strict-transport-security',
    display: 'Strict-Transport-Security',
    description: 'Forces HTTPS connections',
  },
  {
    name: 'x-content-type-options',
    display: 'X-Content-Type-Options',
    description: 'Prevents MIME sniffing attacks',
    recommended: 'nosniff',
  },
  {
    name: 'x-frame-options',
    display: 'X-Frame-Options',
    description: 'Prevents clickjacking',
    recommended: ['DENY', 'SAMEORIGIN'],
  },
  {
    name: 'content-security-policy',
    display: 'Content-Security-Policy',
    description: 'Controls what resources can load',
  },
  {
    name: 'referrer-policy',
    display: 'Referrer-Policy',
    description: 'Controls referrer information leakage',
  },
  {
    name: 'permissions-policy',
    display: 'Permissions-Policy',
    description: 'Restricts browser feature access',
  },
]

// Checks a single header and returns its status
function checkHeader(header, headers) {
  const value = headers.get(header.name)

  if (!value) {
    return { ...header, status: 'missing', value: null }
  }

  if (header.recommended) {
    const recommended = Array.isArray(header.recommended)
      ? header.recommended
      : [header.recommended]

    const isValid = recommended.some(r =>
      value.toLowerCase().includes(r.toLowerCase())
    )

    if (!isValid) {
      return { ...header, status: 'misconfigured', value }
    }
  }

  return { ...header, status: 'present', value }
}

// Converts a numeric score to a letter grade
function calculateGrade(score, total) {
  const percentage = score / total
  if (percentage === 1) return 'A'
  if (percentage >= 0.8) return 'B'
  if (percentage >= 0.5) return 'C'
  if (percentage >= 0.2) return 'D'
  return 'F'
}

// Main function — runs the full audit and returns a result object
export function runAudit(headers) {
  const results = SECURITY_HEADERS.map(header => checkHeader(header, headers))

  const score = results.filter(r => r.status === 'present').length
  const total = SECURITY_HEADERS.length
  const grade = calculateGrade(score, total)

  return { results, score, total, grade }
}