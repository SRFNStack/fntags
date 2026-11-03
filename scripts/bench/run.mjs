#!/usr/bin/env node
// Local js-framework-benchmark style harness.
//
// Loads a framework's benchmark page from a local checkout of
// krausest/js-framework-benchmark in headless Chrome (puppeteer-core, system
// Chrome), runs the same init/warmup/run steps as the official puppeteer
// runner (webdriver-ts/src/benchmarksPuppeteer.ts) and measures each run from
// the click EventDispatch to the end of the last Commit in a Chrome trace,
// the way webdriver-ts/src/timeline.ts computeResultsCPU does.
//
// Usage:
//   node run.mjs --framework fntags --iterations 10
//   node run.mjs --framework fntags,vanillajs --benchmark 01,07,08
// See README.md for all options.

import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs (argv) {
  const opts = {
    framework: ['fntags'],
    iterations: 10,
    benchmark: [],
    throttling: true,
    headless: true,
    chrome: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    benchRoot: process.env.JSFB_ROOT || path.resolve(here, '../../../js-framework-benchmark'),
    out: null,
    traces: false,
    build: null,
    freshBrowser: false,
    verbose: false
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i]
    switch (a) {
      case '--framework': case '-f': opts.framework = next().split(',').map(s => s.trim()).filter(Boolean); break
      case '--iterations': case '-n': opts.iterations = parseInt(next(), 10); break
      case '--benchmark': case '-b': opts.benchmark = next().split(',').map(s => s.trim()).filter(Boolean); break
      case '--nothrottling': opts.throttling = false; break
      case '--headful': opts.headless = false; break
      case '--chrome': opts.chrome = next(); break
      case '--bench-root': opts.benchRoot = next(); break
      case '--out': case '-o': opts.out = next(); break
      case '--traces': opts.traces = true; break
      case '--build': opts.build = true; break
      case '--no-build': opts.build = false; break
      case '--fresh-browser': opts.freshBrowser = true; break
      case '--verbose': case '-v': opts.verbose = true; break
      case '--help': case '-h': printHelp(); process.exit(0)
      default:
        console.error(`unknown argument: ${a}`)
        printHelp()
        process.exit(1)
    }
  }
  return opts
}

function printHelp () {
  console.log(`node run.mjs [options]

  --framework, -f   comma separated framework dirs under frameworks/keyed (default: fntags)
  --iterations, -n  measured runs per benchmark (default: 10)
  --benchmark, -b   comma separated substrings matching benchmark ids, e.g. 01,07 (default: all 9 CPU benchmarks)
  --nothrottling    disable the CPU throttling the official runner applies to 03,04,05,06,09
  --headful         show the browser window (default: headless=new)
  --chrome <path>   Chrome binary (default: /Applications/Google Chrome.app/..., or $CHROME_PATH)
  --bench-root <p>  js-framework-benchmark checkout (default: ../../../js-framework-benchmark, or $JSFB_ROOT)
  --out, -o <file>  JSON output path (default: results/<frameworks>-<timestamp>.json)
  --traces          keep the raw Chrome trace of every run under traces/
  --build           rebuild the fntags benchmark bundle before running (default when fntags is in --framework)
  --no-build        skip the rebuild
  --fresh-browser   launch a new browser for every iteration, like the official runner (slower)
  --verbose, -v     log every step
`)
}

// ---------------------------------------------------------------------------
// Static file server rooted at the benchmark checkout
// ---------------------------------------------------------------------------
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm'
}

function startStaticServer (root) {
  const server = http.createServer((req, res) => {
    let urlPath
    try { urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname) } catch { urlPath = '/' }
    let file = path.normalize(path.join(root, urlPath))
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found: ' + urlPath); return }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

// ---------------------------------------------------------------------------
// Page helpers (ported from webdriver-ts/src/puppeteerAccess.ts)
// ---------------------------------------------------------------------------
const wait = ms => ms === 0 ? Promise.resolve() : new Promise(r => setTimeout(r, ms))

async function checkElementNotExists (page, selector) {
  for (let k = 0; k < 10; k++) {
    const sel = await page.$(selector)
    if (!sel) return
    await sel.dispose()
    await wait(k < 3 ? 10 : 1000)
  }
  throw new Error(`checkElementNotExists failed for ${selector}`)
}

async function checkElementExists (page, selector) {
  for (let k = 0; k < 10; k++) {
    const sel = await page.$(selector)
    if (sel) { await sel.dispose(); return }
    await wait(k < 3 ? 10 : 1000)
  }
  throw new Error(`checkElementExists failed for ${selector}`)
}

async function clickElement (page, selector) {
  const elem = await page.$(selector)
  if (!elem) throw new Error(`clickElement ${selector} failed. Element was not found.`)
  await elem.click()
  await elem.dispose()
}

async function checkElementContainsText (page, selector, expectedText) {
  let txt
  for (let k = 0; k < 10; k++) {
    const elem = await page.$(selector)
    if (elem) {
      txt = await elem.evaluate(e => e?.innerText)
      await elem.dispose()
      if (txt && txt.includes(expectedText)) return
    }
    await wait(k < 3 ? 10 : 1000)
  }
  throw new Error(`checkElementContainsText ${selector} failed. expected ${expectedText}, but was ${txt}`)
}

async function checkElementHasClass (page, selector, className) {
  let clazzes
  for (let k = 0; k < 10; k++) {
    const elem = await page.$(selector)
    if (elem) {
      clazzes = await elem.evaluate(e => e ? Array.from(e.classList) : undefined)
      await elem.dispose()
      if (clazzes && clazzes.includes(className)) return
    }
    await wait(k < 3 ? 10 : 1000)
  }
  throw new Error(`checkElementHasClass ${selector} failed. expected ${className}, but was ${clazzes}`)
}

async function checkCountForSelector (page, selector, expectedCount) {
  const elems = await page.$$(selector)
  if (elems.length !== expectedCount) {
    throw new Error(`checkCountForSelector ${selector} failed. expected ${expectedCount}, but ${elems.length} were found`)
  }
}

// ---------------------------------------------------------------------------
// Benchmarks (ported from webdriver-ts/src/benchmarksPuppeteer.ts and
// benchmarksCommon.ts). "pierce/" lets selectors cross shadow roots.
// ---------------------------------------------------------------------------
const P = 'pierce/'

async function createClearWarmup (page, warmupCount) {
  for (let i = 0; i < warmupCount; i++) {
    await clickElement(page, P + '#run')
    await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(1)>td:nth-of-type(1)', (i * 1000 + 1).toFixed())
    await clickElement(page, P + '#clear')
    await checkElementNotExists(page, P + 'tbody>tr:nth-of-type(1000)>td:nth-of-type(1)')
  }
}

export const benchmarks = [
  {
    id: '01_run1k', label: 'create rows', warmupCount: 5, throttle: undefined,
    async init (page) {
      await checkElementExists(page, P + '#run')
      await createClearWarmup(page, this.warmupCount)
    },
    async run (page) {
      await clickElement(page, P + '#run')
      await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(1000)>td:nth-of-type(1)', ((this.warmupCount + 1) * 1000).toFixed())
    }
  },
  {
    id: '02_replace1k', label: 'replace all rows', warmupCount: 5, throttle: undefined,
    async init (page) {
      await checkElementExists(page, P + '#run')
      for (let i = 0; i < this.warmupCount; i++) {
        await clickElement(page, P + '#run')
        await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(1)>td:nth-of-type(1)', (i * 1000 + 1).toFixed())
      }
    },
    async run (page) {
      await clickElement(page, P + '#run')
      await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(1)>td:nth-of-type(1)', `${this.warmupCount * 1000 + 1}`)
    }
  },
  {
    id: '03_update10th1k_x16', label: 'partial update', warmupCount: 3, throttle: 4,
    async init (page) {
      await checkElementExists(page, P + '#run')
      await clickElement(page, P + '#run')
      await checkElementExists(page, P + 'tbody>tr:nth-of-type(1000)>td:nth-of-type(1)')
      for (let i = 0; i < this.warmupCount; i++) {
        await clickElement(page, P + '#update')
        await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(991)>td:nth-of-type(2)>a', ' !!!'.repeat(i + 1))
      }
    },
    async run (page) {
      await clickElement(page, P + '#update')
      await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(991)>td:nth-of-type(2)>a', ' !!!'.repeat(this.warmupCount + 1))
    }
  },
  {
    id: '04_select1k', label: 'select row', warmupCount: 5, throttle: 4,
    async init (page) {
      await checkElementExists(page, P + '#run')
      await clickElement(page, P + '#run')
      await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(1000)>td:nth-of-type(1)', '1000')
      const i = 0
      await clickElement(page, P + `tbody>tr:nth-of-type(${i + 5})>td:nth-of-type(2)>a`)
      await checkElementHasClass(page, P + `tbody>tr:nth-of-type(${i + 5})`, 'danger')
      await checkCountForSelector(page, P + 'tbody>tr.danger', 1)
    },
    async run (page) {
      await clickElement(page, P + 'tbody>tr:nth-of-type(2)>td:nth-of-type(2)>a')
      await checkElementHasClass(page, P + 'tbody>tr:nth-of-type(2)', 'danger')
    }
  },
  {
    id: '05_swap1k', label: 'swap rows', warmupCount: 5, throttle: 4,
    async init (page) {
      await checkElementExists(page, P + '#run')
      await clickElement(page, P + '#run')
      await checkElementExists(page, P + 'tbody>tr:nth-of-type(1000)>td:nth-of-type(1)')
      for (let i = 0; i <= this.warmupCount; i++) {
        const text = i % 2 === 0 ? '2' : '999'
        await clickElement(page, P + '#swaprows')
        await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(999)>td:nth-of-type(1)', text)
      }
    },
    async run (page) {
      await clickElement(page, P + '#swaprows')
      const text999 = this.warmupCount % 2 === 0 ? '999' : '2'
      const text2 = this.warmupCount % 2 === 0 ? '2' : '999'
      await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(999)>td:nth-of-type(1)', text999)
      await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(2)>td:nth-of-type(1)', text2)
    }
  },
  {
    id: '06_remove-one-1k', label: 'remove row', warmupCount: 5, throttle: 2, rowsToSkip: 4,
    async init (page) {
      const { warmupCount, rowsToSkip } = this
      await checkElementExists(page, P + '#run')
      await clickElement(page, P + '#run')
      await checkElementExists(page, P + 'tbody>tr:nth-of-type(1000)>td:nth-of-type(1)')
      for (let i = 0; i < warmupCount; i++) {
        const rowToClick = warmupCount - i + rowsToSkip
        await checkElementContainsText(page, P + `tbody>tr:nth-of-type(${rowToClick})>td:nth-of-type(1)`, rowToClick.toString())
        await clickElement(page, P + `tbody>tr:nth-of-type(${rowToClick})>td:nth-of-type(3)>a>span:nth-of-type(1)`)
        await checkElementContainsText(page, P + `tbody>tr:nth-of-type(${rowToClick})>td:nth-of-type(1)`, `${rowsToSkip + warmupCount + 1}`)
      }
      await checkElementContainsText(page, P + `tbody>tr:nth-of-type(${rowsToSkip + 1})>td:nth-of-type(1)`, `${rowsToSkip + warmupCount + 1}`)
      await checkElementContainsText(page, P + `tbody>tr:nth-of-type(${rowsToSkip})>td:nth-of-type(1)`, `${rowsToSkip}`)
      // click on a row the second time
      await checkElementContainsText(page, P + `tbody>tr:nth-of-type(${rowsToSkip + 2})>td:nth-of-type(1)`, `${rowsToSkip + warmupCount + 2}`)
      await clickElement(page, P + `tbody>tr:nth-of-type(${rowsToSkip + 2})>td:nth-of-type(3)>a>span:nth-of-type(1)`)
      await checkElementContainsText(page, P + `tbody>tr:nth-of-type(${rowsToSkip + 2})>td:nth-of-type(1)`, `${rowsToSkip + warmupCount + 3}`)
    },
    async run (page) {
      const { warmupCount, rowsToSkip } = this
      await clickElement(page, P + `tbody>tr:nth-of-type(${rowsToSkip})>td:nth-of-type(3)>a>span:nth-of-type(1)`)
      await checkElementContainsText(page, P + `tbody>tr:nth-of-type(${rowsToSkip})>td:nth-of-type(1)`, `${rowsToSkip + warmupCount + 1}`)
    }
  },
  {
    id: '07_create10k', label: 'create many rows', warmupCount: 5, throttle: undefined,
    async init (page) {
      await checkElementExists(page, P + '#run')
      await createClearWarmup(page, this.warmupCount)
    },
    async run (page) {
      await clickElement(page, P + '#runlots')
      await checkElementExists(page, P + 'tbody>tr:nth-of-type(10000)>td:nth-of-type(2)>a')
    }
  },
  {
    id: '08_create1k-after1k_x2', label: 'append rows to large table', warmupCount: 5, throttle: undefined,
    async init (page) {
      await checkElementExists(page, P + '#run')
      await createClearWarmup(page, this.warmupCount)
      await clickElement(page, P + '#run')
      await checkElementExists(page, P + 'tbody>tr:nth-of-type(1000)>td:nth-of-type(1)')
    },
    async run (page) {
      await clickElement(page, P + '#add')
      await checkElementExists(page, P + 'tbody>tr:nth-of-type(2000)>td:nth-of-type(1)')
    }
  },
  {
    id: '09_clear1k_x8', label: 'clear rows', warmupCount: 5, throttle: 4,
    async init (page) {
      await checkElementExists(page, P + '#run')
      await createClearWarmup(page, this.warmupCount)
      await clickElement(page, P + '#run')
      await checkElementContainsText(page, P + 'tbody>tr:nth-of-type(1)>td:nth-of-type(1)', (this.warmupCount * 1000 + 1).toFixed())
    },
    async run (page) {
      await clickElement(page, P + '#clear')
      await checkElementNotExists(page, P + 'tbody>tr:nth-of-type(1000)>td:nth-of-type(1)')
    }
  }
]

// ---------------------------------------------------------------------------
// Trace analysis (ported from webdriver-ts/src/timeline.ts)
// ---------------------------------------------------------------------------
const traceCategories = [
  'disabled-by-default-v8.cpu_profiler',
  'blink.user_timing',
  'devtools.timeline',
  'disabled-by-default-devtools.timeline'
]

const traceJSEventNames = [
  'EventDispatch', 'EvaluateScript', 'v8.evaluateModule', 'FunctionCall', 'TimerFire',
  'FireIdleCallback', 'FireAnimationFrame', 'RunMicrotasks', 'V8.Execute'
]

const tracePaintEventNames = ['UpdateLayoutTree', 'Layout', 'Commit', 'Paint', 'Layerize', 'PrePaint']

function extractRelevantEvents (entries, startLogicEvent) {
  const out = []
  const push = (type, e, dur = e.dur) => out.push({ type, ts: +e.ts, dur: +dur, end: +e.ts + (+dur), pid: e.pid })
  for (const e of entries) {
    if (e.name === 'EventDispatch') {
      const t = e.args?.data?.type
      if (t === startLogicEvent) push('startLogicEvent', e)
      if (t === 'click') push('click', e)
      else if (t === 'mousedown') push('mousedown', e)
      else if (t === 'pointerup') push('pointerup', e)
    } else if (e.ph === 'X' && e.name === 'Layout') push('layout', e)
    else if (e.ph === 'X' && e.name === 'FunctionCall') push('functioncall', e)
    else if (e.ph === 'X' && e.name === 'HitTest') push('hittest', e)
    else if (e.ph === 'X' && e.name === 'Commit') push('commit', e)
    else if (e.ph === 'X' && e.name === 'Paint') push('paint', e)
    else if (e.ph === 'X' && e.name === 'FireAnimationFrame') push('fireAnimationFrame', e)
    else if (e.ph === 'X' && e.name === 'TimerFire') push('timerFire', e, 0)
    else if (e.name === 'RequestAnimationFrame') push('requestAnimationFrame', e, 0)
  }
  return out
}

export class TraceError extends Error {}

export function computeResultsCPU (entries, startLogicEventName = 'click') {
  const events = extractRelevantEvents(entries, startLogicEventName).sort((a, b) => a.end - b.end)

  const mousedowns = events.filter(e => e.type === 'mousedown')
  if (mousedowns.length > 1) throw new TraceError('at most one mousedown event is expected')

  const clicks = events.filter(e => e.type === 'startLogicEvent')
  if (clicks.length !== 1) throw new TraceError('exactly one click event is expected')
  const click = clicks[0]

  const pid = click.pid
  const eventsDuringBenchmark = events.filter(e => e.ts > click.end || e.type === 'click')
  const onMain = eventsDuringBenchmark.filter(e => e.pid === pid)

  const startFrom = onMain.filter(e => ['click', 'fireAnimationFrame', 'timerFire', 'layout', 'functioncall'].includes(e.type))
  const startFromEvent = startFrom.at(-1)
  const allCommits = onMain.filter(e => e.type === 'commit')
  let commit = startFromEvent ? allCommits.find(e => e.ts > startFromEvent.end) : undefined
  if (!commit) {
    if (allCommits.length === 0) throw new TraceError('No commit event found')
    commit = allCommits.at(-1)
  }

  let duration = (commit.end - click.ts) / 1000.0
  const layouts = onMain.filter(e => e.type === 'layout')

  // Adjust bogus delay for requestAnimationFrame (same rule as the official runner)
  const rafsWithinClick = events.filter(e => e.type === 'requestAnimationFrame' && e.ts >= click.ts && e.ts <= click.end)
  const fafs = events.filter(e => e.type === 'fireAnimationFrame' && e.ts >= click.ts && e.ts < commit.ts)
  let rafLongDelay = 0
  if (rafsWithinClick.length > 0 && fafs.length > 0) {
    const waitDelay = (fafs[0].ts - click.end) / 1000.0
    if (rafsWithinClick.length === 1 && fafs.length === 1) {
      if (waitDelay > 16 && !layouts.some(l => l.ts < fafs[0].ts)) {
        rafLongDelay = waitDelay - 16
        duration -= rafLongDelay
      }
    } else if (fafs.length === 1) {
      throw new TraceError('One fire animation frame, but non consistent request animation frames')
    }
  }

  return {
    tsStart: click.ts,
    tsEnd: commit.end,
    duration,
    layouts: layouts.length,
    rafLongDelay,
    numberCommits: allCommits.length,
    maxDeltaBetweenCommits: allCommits.length ? (allCommits.at(-1).ts - allCommits[0].ts) / 1000.0 : 0
  }
}

// Sum of the durations of the given trace events inside [tsStart, tsEnd],
// dropping events fully contained in another counted event.
function computeResultsFromTrace (cpu, entries, relevantNames, includeClick) {
  const evs = []
  for (const e of entries) {
    if (e.name === 'EventDispatch') {
      if (includeClick && e.args?.data?.type === 'click') evs.push({ start: +e.ts, end: +e.ts + e.dur })
    } else if (e.ph === 'X' && relevantNames.includes(e.name)) {
      evs.push({ start: +e.ts, end: +e.ts + e.dur })
    }
  }
  const within = evs.filter(e => e.start >= cpu.tsStart && e.start <= cpu.tsEnd)
  const contained = (a, b) => a.start >= b.start && a.end <= b.end
  let intervals = []
  for (const ev of within) {
    const next = []
    if (!intervals.some(iv => contained(ev, iv))) next.push(ev)
    for (const iv of intervals) if (!contained(iv, ev)) next.push(iv)
    intervals = next
  }
  return intervals.reduce((p, c) => p + (c.end - c.start), 0) / 1000.0
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
function stats (values) {
  const v = [...values].sort((a, b) => a - b)
  const n = v.length
  if (n === 0) return { min: NaN, max: NaN, mean: NaN, median: NaN, stddev: NaN, values: [] }
  const mean = v.reduce((a, b) => a + b, 0) / n
  const median = n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2
  const stddev = n > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0
  return { min: v[0], max: v[n - 1], mean, median, stddev, values }
}

const r1 = x => Number.isFinite(x) ? x.toFixed(1) : 'n/a'

function renderTable (rows, columns) {
  const widths = columns.map(c => Math.max(c.label.length, ...rows.map(r => String(r[c.key] ?? '').length)))
  const line = (cells, pad = ' ') => '| ' + cells.map((c, i) => (columns[i].align === 'right' ? String(c).padStart(widths[i], pad) : String(c).padEnd(widths[i], pad))).join(' | ') + ' |'
  const out = [line(columns.map(c => c.label)), line(columns.map(() => ''), '-')]
  for (const r of rows) out.push(line(columns.map(c => r[c.key] ?? '')))
  return out.join('\n')
}

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------
async function launchBrowser (opts) {
  const width = 1280; const height = 800
  const disableFeatures = ['Translate', 'PrivacySandboxSettings4', 'IPH_SidePanelGenericMenuFeature']
  const args = [
    `--window-size=${width},${height}`,
    '--js-flags=--expose-gc',
    '--no-default-browser-check',
    '--disable-sync',
    '--no-first-run',
    '--ash-no-nudges',
    '--disable-extensions',
    `--disable-features=${disableFeatures.join(',')}`
  ]
  if (opts.headless) args.push('--headless=new')
  return puppeteer.launch({
    headless: false,
    executablePath: opts.chrome,
    args,
    defaultViewport: { width, height }
  })
}

function frameworkInfo (benchRoot, name) {
  const dir = path.join(benchRoot, 'frameworks', 'keyed', name)
  if (!fs.existsSync(path.join(dir, 'index.html'))) {
    throw new Error(`no index.html in ${dir}. Is the framework built? (see README.md)`)
  }
  let pkg = {}
  try { pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) } catch {}
  const jfb = pkg['js-framework-benchmark'] || {}
  return {
    name,
    dir,
    uri: `frameworks/keyed/${name}${jfb.customURL || ''}`,
    startLogicEventName: jfb.startLogicEventName || 'click'
  }
}

async function runOne (browser, fw, bench, opts, baseUrl, iteration) {
  const page = await browser.newPage()
  if (opts.verbose) page.on('console', msg => console.log('BROWSER:', msg.text()))
  try {
    const url = `${baseUrl}/${fw.uri}/index.html`
    try {
      await page.goto(url, { waitUntil: 'networkidle0' })
    } catch {
      await page.goto(url, { waitUntil: 'networkidle0' })
    }
    await bench.init(page)

    const throttle = opts.throttling ? bench.throttle : undefined
    if (throttle) await page.emulateCPUThrottling(throttle)

    await page.tracing.start({ screenshots: false, categories: traceCategories })
    await wait(50)
    await page.evaluate("window.gc({type:'major',execution:'sync',flavor:'last-resort'})")

    await bench.run(page)

    await wait(100)
    const buf = await page.tracing.stop()
    if (throttle) await page.emulateCPUThrottling(1)

    const trace = JSON.parse(Buffer.from(buf).toString('utf8'))
    const entries = trace.traceEvents
    if (opts.traces) {
      const tdir = path.join(here, 'traces')
      fs.mkdirSync(tdir, { recursive: true })
      fs.writeFileSync(path.join(tdir, `${fw.name}_${bench.id}_${iteration}.json`), JSON.stringify(trace))
    }
    const cpu = computeResultsCPU(entries, fw.startLogicEventName)
    const script = computeResultsFromTrace(cpu, entries, traceJSEventNames, true)
    const paint = computeResultsFromTrace(cpu, entries, tracePaintEventNames, false)
    if (cpu.duration < 0) throw new Error(`duration ${cpu.duration} < 0`)
    return { total: cpu.duration, script, paint, layouts: cpu.layouts, commits: cpu.numberCommits, rafLongDelay: cpu.rafLongDelay }
  } finally {
    await page.close()
  }
}

async function runFramework (fw, benches, opts, baseUrl) {
  const results = {}
  let browser = opts.freshBrowser ? null : await launchBrowser(opts)
  try {
    for (const bench of benches) {
      const runs = []
      process.stdout.write(`${fw.name.padEnd(14)} ${bench.id.padEnd(24)} `)
      let retries = 0
      for (let i = 0; i < opts.iterations; i++) {
        if (opts.freshBrowser) browser = await launchBrowser(opts)
        try {
          const r = await runOne(browser, fw, bench, opts, baseUrl, i)
          runs.push(r)
          process.stdout.write(`${r1(r.total)} `)
        } catch (err) {
          if (err instanceof TraceError && retries < 3) {
            retries++
            process.stdout.write(`(retry: ${err.message}) `)
            i--
            continue
          }
          process.stdout.write(`\n  ERROR in ${bench.id}: ${err.message}\n`)
          break
        } finally {
          if (opts.freshBrowser && browser) { await browser.close(); browser = null }
        }
      }
      const total = stats(runs.map(r => r.total))
      const script = stats(runs.map(r => r.script))
      const paint = stats(runs.map(r => r.paint))
      process.stdout.write(`| median ${r1(total.median)} mean ${r1(total.mean)}\n`)
      results[bench.id] = {
        label: bench.label,
        throttle: opts.throttling ? bench.throttle ?? 1 : 1,
        warmupCount: bench.warmupCount,
        total,
        script,
        paint,
        runs
      }
    }
  } finally {
    if (browser) await browser.close()
  }
  return results
}

function buildFntags (opts) {
  const dir = path.join(opts.benchRoot, 'frameworks', 'keyed', 'fntags')
  console.log(`building fntags benchmark bundle in ${dir}`)
  const res = spawnSync('npx', ['rollup', '-c', 'rollup.fntags.mjs'], {
    cwd: here,
    env: { ...process.env, JSFB_ENTRY: dir },
    stdio: 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32'
  })
  const log = (res.stdout || '') + (res.stderr || '')
  const src = log.split('\n').find(l => l.includes('[fntags]'))
  if (src) console.log(src.trim())
  if (res.status !== 0) {
    console.error(log)
    throw new Error('rollup build failed')
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main () {
  const opts = parseArgs(process.argv.slice(2))
  opts.benchRoot = path.resolve(opts.benchRoot)
  if (!fs.existsSync(path.join(opts.benchRoot, 'frameworks', 'keyed'))) {
    throw new Error(`js-framework-benchmark checkout not found at ${opts.benchRoot} (use --bench-root or $JSFB_ROOT)`)
  }
  if (!fs.existsSync(opts.chrome)) {
    throw new Error(`Chrome binary not found at ${opts.chrome} (use --chrome or $CHROME_PATH)`)
  }

  const benches = opts.benchmark.length
    ? benchmarks.filter(b => opts.benchmark.some(s => b.id.includes(s)))
    : benchmarks
  if (benches.length === 0) throw new Error(`no benchmark matches ${opts.benchmark.join(',')}`)

  const shouldBuild = opts.build ?? opts.framework.includes('fntags')
  if (shouldBuild) buildFntags(opts)

  const frameworks = opts.framework.map(n => frameworkInfo(opts.benchRoot, n))

  const { server, port } = await startStaticServer(opts.benchRoot)
  const baseUrl = `http://127.0.0.1:${port}`
  console.log(`serving ${opts.benchRoot} at ${baseUrl}`)
  console.log(`chrome: ${opts.chrome}`)
  console.log(`iterations: ${opts.iterations}, throttling: ${opts.throttling ? 'on (official factors)' : 'off'}, headless: ${opts.headless}`)
  console.log('')

  const started = new Date()
  const out = {
    date: started.toISOString(),
    host: { platform: process.platform, arch: process.arch, node: process.version },
    chrome: opts.chrome,
    iterations: opts.iterations,
    throttling: opts.throttling,
    frameworks: {}
  }

  try {
    for (const fw of frameworks) {
      out.frameworks[fw.name] = await runFramework(fw, benches, opts, baseUrl)
      console.log('')
    }
  } finally {
    server.close()
  }

  // Per framework table
  for (const fw of frameworks) {
    const res = out.frameworks[fw.name]
    console.log(`${fw.name} (ms, ${opts.iterations} iterations)`)
    const rows = Object.entries(res).map(([id, r]) => ({
      benchmark: id,
      median: r1(r.total.median),
      mean: r1(r.total.mean),
      min: r1(r.total.min),
      max: r1(r.total.max),
      stddev: r1(r.total.stddev),
      script: r1(r.script.median),
      paint: r1(r.paint.median),
      throttle: r.throttle > 1 ? `${r.throttle}x` : ''
    }))
    console.log(renderTable(rows, [
      { key: 'benchmark', label: 'benchmark' },
      { key: 'median', label: 'median', align: 'right' },
      { key: 'mean', label: 'mean', align: 'right' },
      { key: 'min', label: 'min', align: 'right' },
      { key: 'max', label: 'max', align: 'right' },
      { key: 'stddev', label: 'stddev', align: 'right' },
      { key: 'script', label: 'script med', align: 'right' },
      { key: 'paint', label: 'paint med', align: 'right' },
      { key: 'throttle', label: 'cpu', align: 'right' }
    ]))
    console.log('')
  }

  // Comparison table of medians when more than one framework ran
  if (frameworks.length > 1) {
    console.log(`median total ms (${opts.iterations} iterations)`)
    const rows = benches.map(b => {
      const row = { benchmark: b.id }
      for (const fw of frameworks) row[fw.name] = r1(out.frameworks[fw.name][b.id]?.total.median)
      return row
    })
    console.log(renderTable(rows, [
      { key: 'benchmark', label: 'benchmark' },
      ...frameworks.map(fw => ({ key: fw.name, label: fw.name, align: 'right' }))
    ]))
    console.log('')
  }

  const outPath = opts.out || path.join(here, 'results', `${frameworks.map(f => f.name).join('+')}-${started.toISOString().replace(/[:.]/g, '-')}.json`)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log(`wrote ${outPath}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
