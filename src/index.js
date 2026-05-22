import { runAudit } from './audit.js'
import { renderReport } from './reporter.js'

export async function auditFetch(url, options = {}) {
  // Pull out audit-specific options, keep the rest for native fetch
  const { audit = {}, ...fetchOptions } = options
  const { silent = false, failOn = null } = audit

  // Extract method for the report header, default to GET
  const method = fetchOptions.method?.toUpperCase() ?? 'GET'

  // Make the actual HTTP request
  const response = await fetch(url, fetchOptions)

  // Run the audit against the response headers
  const auditResult = runAudit(response.headers)

  // Print the report unless silent mode is on
  if (!silent) {
    renderReport(url, method, auditResult)
  }

  // Optionally throw if the grade is below a threshold
  if (failOn) {
    const grades = ['A', 'B', 'C', 'D', 'F']
    const failIndex = grades.indexOf(failOn.toUpperCase())
    const gradeIndex = grades.indexOf(auditResult.grade)

    if (failIndex !== -1 && gradeIndex >= failIndex) {
      throw new Error(
        `auditFetch: Security audit failed! Grade ${auditResult.grade} does not meet the required threshold of ${failOn.toUpperCase()}`
      )
    }
  }

  // Return the original response completely untouched
  return response
}

export async function getAuditResult(url, options = {}) {
  const { audit = {}, ...fetchOptions } = options
  const { silent = false } = audit

  const method = fetchOptions.method?.toUpperCase() ?? 'GET'
  const response = await fetch(url, fetchOptions)
  const auditResult = runAudit(response.headers)

  if (!silent) {
    renderReport(url, method, auditResult)
  }

  return {
    url,
    status: response.status,
    grade: auditResult.grade,
    score: auditResult.score,
    total: auditResult.total,
    results: auditResult.results.map(({ recommended: _r, ...r }) => r),
  }
}