import chalk from 'chalk'

// Icons for each status
const STATUS_ICONS = {
  present: chalk.green('✅'),
  missing: chalk.yellow('⚠️ '),
  misconfigured: chalk.red('❌'),
}

// Colours for each status label
const STATUS_COLOURS = {
  present: chalk.green,
  missing: chalk.yellow,
  misconfigured: chalk.red,
}

// Colours for each grade
const GRADE_COLOURS = {
  A: chalk.green,
  B: chalk.green,
  C: chalk.yellow,
  D: chalk.red,
  F: chalk.red,
}

// Renders a progress bar based on score vs total
function renderProgressBar(score, total, width = 20) {
  const filled = Math.round((score / total) * width)
  const empty = width - filled
  const bar = chalk.green('█'.repeat(filled)) + chalk.grey('░'.repeat(empty))
  return `[${bar}]`
}

// Pads a string to a fixed length for column alignment
function pad(str, length) {
  return str.padEnd(length, ' ')
}

// Renders the full audit report to the terminal
export function renderReport(url, method = 'GET', auditResult) {
  const { results, score, total, grade } = auditResult
  const gradeColour = GRADE_COLOURS[grade] ?? chalk.white
  const progressBar = renderProgressBar(score, total)
  const border = '─'.repeat(54)

  console.log('')
  console.log(chalk.bold(`┌${border}┐`))
  console.log(chalk.bold(`│`) + chalk.cyan.bold('  auditFetch - Security Report' + ' '.repeat(24)) + chalk.bold('│'))
  console.log(chalk.bold(`│`) + `  ${chalk.dim(method)} ${chalk.dim(url)}` + ' '.repeat(Math.max(0, 52 - method.length - url.length - 1)) + chalk.bold('│'))
  const scoreLine = `  Score: ${score}/${total}  Grade: ${gradeColour.bold(grade)}`
  const scoreLineRaw = `  Score: ${score}/${total}  Grade: ${grade}`
  console.log(chalk.bold('│') + scoreLine + '  ' + progressBar + ' '.repeat(Math.max(0, 52 - scoreLineRaw.length - 22)) + chalk.bold('│'))
  console.log(chalk.bold(`├${border}┤`))

  for (const result of results) {
    const icon = STATUS_ICONS[result.status]
    const colourFn = STATUS_COLOURS[result.status]
    const headerCol = pad(result.display, 34)
    const statusCol = pad(result.status, 14)
    console.log(
      chalk.bold('│') +
      `  ${icon}  ${colourFn(headerCol)}${chalk.dim(statusCol)}` +
      chalk.bold('│')
    )
  }

  console.log(chalk.bold(`└${border}┘`))
  console.log('')
}