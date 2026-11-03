// Profiles fntags on the js-framework-benchmark create-rows operations.
//
//   node profile.mjs                       all ops, dev=1 and dev=0 timing, profiles with dev=1
//   node profile.mjs --ops create1k        subset: create1k,create10k,add1k
//   node profile.mjs --reps 7 --top 40     more timing reps / longer tables
//   node profile.mjs --profreps 10          warm clicks aggregated per CPU profile (default 5)
//   node profile.mjs --no-snapshot         skip the heap snapshot class-count section
//   node profile.mjs --sections cpu,trace  run only some sections (timing,cpu,trace,alloc,snapshot,exp)
//   node profile.mjs --headful             watch it
//   CHROME_PATH=/path/to/chrome node profile.mjs
//
// Writes raw profiles and a results.json to ./results/<timestamp>/ and prints a report to stdout.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { startServer } from './server.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const flag = (name, def) => {
  const i = args.indexOf('--' + name)
  return i === -1 ? def : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true)
}
const OPS_WANTED = String(flag('ops', 'create1k,create10k,add1k')).split(',')
const REPS = Number(flag('reps', 5))
const TOP = Number(flag('top', 30))
const SECTIONS = new Set(String(flag('sections', 'timing,cpu,trace,alloc,snapshot,exp')).split(','))
const SNAPSHOT = !args.includes('--no-snapshot') && SECTIONS.has('snapshot')
const HEADFUL = args.includes('--headful')
const SAMPLING_US = Number(flag('interval', 100))
const PROFREPS = Number(flag('profreps', 5))

function findChrome () {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const cands = []
  const cache = path.join(os.homedir(), '.cache/puppeteer/chrome')
  if (fs.existsSync(cache)) {
    for (const d of fs.readdirSync(cache).sort().reverse()) {
      cands.push(path.join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'))
      cands.push(path.join(cache, d, 'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'))
      cands.push(path.join(cache, d, 'chrome-linux64/chrome'))
    }
  }
  cands.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium')
  const found = cands.find(c => fs.existsSync(c))
  if (!found) throw new Error('No Chrome found; set CHROME_PATH')
  return found
}

// Benchmark semantics: every measurement is a fresh page. "cold" = first click after
// load. "warm" = same page after the op has already run a few times (JIT warmed).
const OPS = {
  create1k: { click: 'run', setup: [], warmup: ['run', 'clear', 'run', 'clear', 'run', 'clear'] },
  create10k: { click: 'runlots', setup: [], warmup: ['runlots', 'clear', 'runlots', 'clear'] },
  add1k: { click: 'add', setup: ['run'], warmup: ['add', 'add', 'clear', 'run', 'add', 'clear', 'run'] }
}
const rowsAfter = (seq) => seq.reduce((n, b) => b === 'run' ? 1000 : b === 'runlots' ? 10000 : b === 'add' ? n + 1000 : 0, 0)

const DOM_NATIVE = new Set(['createElement', 'createElementNS', 'cloneNode', 'append', 'appendChild', 'insertBefore',
  'insertAdjacentElement', 'setAttribute', 'setAttributeNS', 'addEventListener', 'replaceWith', 'createTextNode',
  'createDocumentFragment', 'remove', 'get lastChild', 'get previousSibling', 'get firstChild', 'get nextSibling',
  'get childNodes', 'get nodeType', 'set textContent', 'get activeElement', 'contains', 'removeChild', 'get length',
  'set className', 'set id', 'set value', 'get style', 'set hidden', 'set disabled', 'set checked'])

const shortUrl = u => !u ? '' : u.includes('/src/fntags.mjs') ? 'fntags.mjs' : u.includes('/page/Main.js') ? 'Main.js' : u.includes('/page/experiments.js') ? 'experiments.js' : u.replace(/^.*\//, '')
function categorize (cf) {
  const fn = cf.functionName
  if (fn === '(garbage collector)') return 'gc'
  if (fn === '(program)') return 'program (V8 internal: compile/IC/runtime, plus style/layout on this thread)'
  if (fn === '(idle)') return 'idle'
  if (fn === '(root)') return 'root'
  if (cf.url) {
    const s = shortUrl(cf.url)
    if (s === 'fntags.mjs') return 'js: fntags.mjs'
    if (s === 'Main.js') return 'js: Main.js'
    return s.startsWith('pptr:evaluate') ? 'js: harness (puppeteer evaluate wrapper)' : 'js: other (' + s + ')'
  }
  if (DOM_NATIVE.has(fn)) return 'native: DOM'
  return 'native: other builtin'
}
const fnKey = cf => `${cf.functionName || '(anonymous)'} ${cf.url ? shortUrl(cf.url) + ':' + (cf.lineNumber + 1) : '[native]'}`

function aggregateProfile (profile, handlerReps = 1) {
  const nodes = new Map(profile.nodes.map(n => [n.id, n]))
  const parentOf = new Map()
  for (const n of profile.nodes) for (const c of n.children || []) parentOf.set(c, n.id)
  // A sample is "in handler" when its stack contains the native HTMLElement.click frame (the button's onclick runs under it). (program) and
  // (garbage collector) samples are top-level in V8 profiles, so they count as in-handler when the
  // nearest non-program/gc samples on both sides are in-handler (i.e. they are interior to a click).
  // Both frames are required: the measured button's handler runs under native click, inside the
  // clickOp evaluate; the warmup/clear clicks run under clickQuiet and must not count.
  const memo = new Map()
  const isUnder = id => {
    if (memo.has(id)) return memo.get(id)
    const cf = nodes.get(id).callFrame
    const p = parentOf.has(id) ? isUnder(parentOf.get(id)) : { click: false, op: false }
    const r = { click: p.click || (cf.functionName === 'click' && !cf.url), op: p.op || (cf.url || '').includes('pptr:evaluate;clickOp') }
    memo.set(id, r)
    return r
  }
  const inClickHandler = id => { const r = isUnder(id); return r.click && r.op }
  const isTopLevelNonJs = id => { const f = nodes.get(id).callFrame.functionName; return f === '(program)' || f === '(garbage collector)' || f === '(idle)' || f === '(root)' }
  const nearestJsCallerLine = id => {
    let p = parentOf.get(id)
    while (p !== undefined) { const cf = nodes.get(p).callFrame; if (cf.url) return cf; p = parentOf.get(p) }
    return null
  }
  const { samples, timeDeltas } = profile
  const inHandler = new Array(samples.length)
  let lastJs = false
  for (let i = 0; i < samples.length; i++) {
    inHandler[i] = isTopLevelNonJs(samples[i]) ? null : inClickHandler(samples[i])
  }
  // resolve nulls: interior iff previous resolved and next resolved are both true
  const nextJs = new Array(samples.length)
  let nx = false
  for (let i = samples.length - 1; i >= 0; i--) { if (inHandler[i] !== null) nx = inHandler[i]; nextJs[i] = nx }
  for (let i = 0; i < samples.length; i++) { if (inHandler[i] !== null) lastJs = inHandler[i]; else inHandler[i] = lastJs && nextJs[i] }

  const selfUs = new Map()
  const selfUsOutside = new Map()
  for (let i = 0; i < samples.length; i++) {
    const dt = i + 1 < timeDeltas.length ? timeDeltas[i + 1] : 0
    const m = inHandler[i] ? selfUs : selfUsOutside
    m.set(samples[i], (m.get(samples[i]) || 0) + dt)
  }
  const byFn = new Map()
  const byLine = new Map()
  const byNative = new Map()
  const cats = {}
  const outsideCats = {}
  let total = 0
  let outsideTotal = 0
  const add = (m, k, v) => m.set(k, (m.get(k) || 0) + v)
  for (const [id, us] of selfUsOutside) {
    const cat = categorize(nodes.get(id).callFrame)
    if (cat === 'idle' || cat === 'root') continue
    outsideTotal += us
    outsideCats[cat] = (outsideCats[cat] || 0) + us
  }
  for (const [id, us0] of selfUs) {
    const us = us0 / handlerReps
    const n = nodes.get(id)
    const cf = n.callFrame
    const cat = categorize(cf)
    if (cat === 'idle' || cat === 'root') continue
    total += us
    cats[cat] = (cats[cat] || 0) + us
    const isNative = !cf.url && cat.startsWith('native')
    add(byFn, fnKey(cf), us)
    if (isNative) add(byNative, cf.functionName, us)
    if (n.positionTicks && n.positionTicks.length) {
      const ticks = n.positionTicks.reduce((s, p) => s + p.ticks, 0)
      for (const p of n.positionTicks) {
        let key
        if (isNative) {
          const caller = nearestJsCallerLine(id)
          key = `${caller ? shortUrl(caller.url) : '?'}:${p.line}  native ${cf.functionName} called from ${caller ? caller.functionName || 'anonymous' : '?'}`
        } else {
          key = `${shortUrl(cf.url)}:${p.line}  (${cf.functionName || 'anonymous'})`
        }
        add(byLine, key, us * p.ticks / ticks)
      }
    } else {
      add(byLine, fnKey(cf), us)
    }
  }
  const sorted = m => [...m.entries()].sort((a, b) => b[1] - a[1])
  return { totalUs: total, outsideTotalUs: outsideTotal / handlerReps, outsideCats, cats, byFn: sorted(byFn), byLine: sorted(byLine), byNative: sorted(byNative) }
}

// Self time per trace event name on the renderer main thread between the two user-timing marks.
function traceBreakdown (trace) {
  const ev = trace.traceEvents
  const marks = ev.filter(e => e.cat && e.cat.includes('blink.user_timing'))
  const start = marks.filter(e => e.name === 'op-start').pop()
  const end = marks.filter(e => e.name === 'op-end').pop()
  if (!start || !end) return null
  const xs = ev.filter(e => e.ph === 'X' && e.pid === start.pid && e.tid === start.tid && e.ts >= start.ts && e.ts <= end.ts && e.dur)
    .sort((a, b) => a.ts - b.ts || b.dur - a.dur)
  const self = new Map()
  const total = new Map()
  const stack = []
  for (const e of xs) {
    while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) stack.pop()
    if (stack.length) stack[stack.length - 1].childDur += e.dur
    e.childDur = 0
    stack.push(e)
    total.set(e.name, (total.get(e.name) || 0) + e.dur)
  }
  for (const e of xs) self.set(e.name, (self.get(e.name) || 0) + e.dur - e.childDur)
  const window = end.ts - start.ts
  const rows = [...self.entries()].sort((a, b) => b[1] - a[1]).map(([name, s]) => ({ name, selfMs: s / 1000, totalMs: total.get(name) / 1000 }))
  return { windowMs: window / 1000, rows }
}

function aggregateHeapSampling (profile) {
  const byFn = new Map()
  let total = 0
  const walk = n => {
    if (n.selfSize) {
      total += n.selfSize
      const k = fnKey(n.callFrame)
      byFn.set(k, (byFn.get(k) || 0) + n.selfSize)
    }
    for (const c of n.children || []) walk(c)
  }
  walk(profile.head)
  return { totalBytes: total, byFn: [...byFn.entries()].sort((a, b) => b[1] - a[1]) }
}

async function heapSnapshotCounts (client) {
  const chunks = []
  const onChunk = e => chunks.push(e.chunk)
  client.on('HeapProfiler.addHeapSnapshotChunk', onChunk)
  await client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, treatGlobalObjectsAsRoots: true })
  client.off('HeapProfiler.addHeapSnapshotChunk', onChunk)
  const snap = JSON.parse(chunks.join(''))
  const fields = snap.snapshot.meta.node_fields
  const types = snap.snapshot.meta.node_types[0]
  const nf = fields.length
  const iType = fields.indexOf('type'); const iName = fields.indexOf('name'); const iSize = fields.indexOf('self_size')
  const nodes = snap.nodes; const strings = snap.strings
  const counts = new Map()
  for (let i = 0; i < nodes.length; i += nf) {
    const type = types[nodes[i + iType]]
    let name = strings[nodes[i + iName]]
    if (type === 'closure' || type === 'code') name = type + ':' + (name || '(anonymous)')
    else if (type === 'object' || type === 'native') name = type + ':' + name
    else if (type === 'hidden' || type === 'array') name = type + ':' + name
    else name = type + ':' + name
    const c = counts.get(name) || { count: 0, bytes: 0 }
    c.count++; c.bytes += nodes[i + iSize]
    counts.set(name, c)
  }
  return counts
}
function diffCounts (a, b) {
  const out = []
  for (const [k, v] of b) {
    const prev = a.get(k) || { count: 0, bytes: 0 }
    const dc = v.count - prev.count; const db = v.bytes - prev.bytes
    if (dc !== 0 || db !== 0) out.push({ name: k, count: dc, bytes: db })
  }
  return out.sort((x, y) => y.bytes - x.bytes)
}

// Runs the op in-page so the sync click time is exact; op-start/op-end marks bound the trace window.
const clickOp = (page, id) => page.evaluate(async id => {
  const btn = document.getElementById(id)
  performance.mark('op-start')
  const t0 = performance.now()
  btn.click()
  const t1 = performance.now()
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)))
  const t2 = performance.now()
  performance.mark('op-end')
  return { syncMs: t1 - t0, toFrameMs: t2 - t0, rows: document.querySelectorAll('tbody tr').length }
}, id)
const clickQuiet = (page, id) => page.evaluate(async id => {
  document.getElementById(id).click()
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)))
}, id)

const median = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
const fmt = (n, d = 2) => Number(n).toFixed(d)
const pad = (s, n) => String(s).padEnd(n)
const rpad = (s, n) => String(s).padStart(n)

async function main () {
  const chrome = findChrome()
  const { server, port } = await startServer()
  const base = `http://127.0.0.1:${port}/scripts/profile/page/index.html`
  const outDir = path.join(here, 'results', new Date().toISOString().replace(/[:.]/g, '-'))
  fs.mkdirSync(outDir, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: !HEADFUL,
    args: ['--enable-precise-memory-info', '--no-first-run', '--disable-extensions', '--window-size=1200,900', '--js-flags=--expose-gc']
  })
  const report = []
  const say = s => { report.push(s); console.log(s) }
  const results = { chrome: await browser.version(), node: process.version, ops: {}, experiments: {}, snapshot: null }
  say(`# fntags profile  (${results.chrome}, node ${process.version}, sampling ${SAMPLING_US}us, reps ${REPS})`)
  say(`fntags source: ${path.resolve(here, '../../src/fntags.mjs')}`)

  async function freshPage (dev = 1) {
    const page = await browser.newPage()
    await page.goto(base + (dev === 0 ? '?dev=0' : ''), { waitUntil: 'networkidle0' })
    await page.waitForSelector('#run')
    await page.evaluate(() => typeof __exp !== 'undefined')
    return page
  }
  async function prepare (page, seq) { for (const b of seq) await clickQuiet(page, b) }

  for (const opName of OPS_WANTED) {
    const op = OPS[opName]
    if (!op) { say(`unknown op ${opName}`); continue }
    const expectedRows = rowsAfter([...op.setup, op.click])
    const opRes = results.ops[opName] = { timing: {}, profiles: {}, trace: {}, heapSampling: null, retained: null }
    say(`\n\n## ${opName}  (click #${op.click}${op.setup.length ? ' after ' + op.setup.join(',') : ''}; expect ${expectedRows} rows)`)

    // ---- 1. timing only (no profiler attached), cold and warm, dev=1 and dev=0
    for (const dev of SECTIONS.has('timing') ? [1, 0] : []) {
      for (const mode of ['cold', 'warm']) {
        const sync = []; const frame = []
        for (let r = 0; r < REPS; r++) {
          const page = await freshPage(dev)
          await prepare(page, op.setup)
          if (mode === 'warm') await prepare(page, op.warmup)
          const t = await clickOp(page, op.click)
          if (t.rows !== expectedRows) say(`!! row count ${t.rows} != ${expectedRows}`)
          sync.push(t.syncMs); frame.push(t.toFrameMs)
          await page.close()
        }
        opRes.timing[`dev${dev}-${mode}`] = { syncMs: sync, toFrameMs: frame }
        say(`timing dev=${dev} ${pad(mode, 4)}: click handler (JS+DOM) median ${fmt(median(sync))} ms  [${sync.map(x => fmt(x, 1)).join(', ')}]   to next frame (incl. style/layout/paint) median ${fmt(median(frame))} ms`)
      }
    }

    // ---- 2. CPU profiles: cold = the first click on a fresh page; warm = PROFREPS clicks on a
    // warmed page under one profile, per-click numbers (only samples inside the click handler count).
    for (const mode of SECTIONS.has('cpu') ? ['cold', 'warm'] : []) {
      const page = await freshPage(1)
      const client = await page.createCDPSession()
      await prepare(page, op.setup)
      if (mode === 'warm') await prepare(page, op.warmup)
      const reps = mode === 'cold' ? 1 : PROFREPS
      await client.send('Profiler.enable')
      await client.send('Profiler.setSamplingInterval', { interval: SAMPLING_US })
      await client.send('Profiler.start')
      const syncs = []
      for (let r = 0; r < reps; r++) {
        if (r > 0) { await clickQuiet(page, 'clear'); await prepare(page, op.setup) }
        const t = await clickOp(page, op.click)
        if (t.rows !== expectedRows) say(`!! row count ${t.rows} != ${expectedRows}`)
        syncs.push(t.syncMs)
      }
      const { profile } = await client.send('Profiler.stop')
      await page.close()
      fs.writeFileSync(path.join(outDir, `${opName}-${mode}.cpuprofile`), JSON.stringify(profile))
      const agg = aggregateProfile(profile, reps)
      opRes.profiles[mode] = { reps, syncMs: syncs, handlerMs: agg.totalUs / 1000, outsideMs: agg.outsideTotalUs / 1000, cats: agg.cats, outsideCats: agg.outsideCats, byFn: agg.byFn.slice(0, 60), byLine: agg.byLine.slice(0, 60), byNative: agg.byNative.slice(0, 40) }
      say(`\n### CPU profile ${opName} ${mode}  (${reps} click${reps > 1 ? 's averaged' : ''}; click handler wall time ${syncs.map(x => fmt(x, 1)).join('/')} ms; sampled time inside handler ${fmt(agg.totalUs / 1000)} ms per click, ${fmt(agg.totalUs / expectedRows * 1000 / 1000, 1)} us per row)`)
      say('category split of self time inside the click handler:')
      for (const [c, us] of Object.entries(agg.cats).sort((a, b) => b[1] - a[1])) say(`  ${pad(c, 80)} ${rpad(fmt(us / 1000), 9)} ms  ${rpad(fmt(100 * us / agg.totalUs, 1), 5)}%`)
      say(`outside the handler (per click, mostly the frame after: style/layout/paint show as (program); see trace): ${fmt(agg.outsideTotalUs / 1000)} ms  [${Object.entries(agg.outsideCats).sort((a, b) => b[1] - a[1]).map(([c, us]) => c.split(' (')[0] + ' ' + fmt(us / 1000 / reps) + 'ms').join(', ')}]`)
      say(`\ntop ${TOP} self time by function (inside handler, per click):`)
      say(`  ${rpad('ms', 8)} ${rpad('%', 6)}  function`)
      for (const [k, us] of agg.byFn.slice(0, TOP)) say(`  ${rpad(fmt(us / 1000), 8)} ${rpad(fmt(100 * us / agg.totalUs, 1), 6)}  ${k}`)
      say(`\ntop ${TOP} self time by line (positionTicks; natives are attributed to the JS call site line):`)
      say(`  ${rpad('ms', 8)} ${rpad('%', 6)}  file:line`)
      for (const [k, us] of agg.byLine.slice(0, TOP)) say(`  ${rpad(fmt(us / 1000), 8)} ${rpad(fmt(100 * us / agg.totalUs, 1), 6)}  ${k}`)
      say('\nnative functions (self time inside handler):')
      for (const [k, us] of agg.byNative.slice(0, 20)) say(`  ${rpad(fmt(us / 1000), 8)} ms  ${k}`)
    }

    // ---- 3. trace (style/layout/paint/GC as the timeline sees them), warm and cold
    for (const mode of SECTIONS.has('trace') ? ['cold', 'warm'] : []) {
      const page = await freshPage(1)
      await prepare(page, op.setup)
      if (mode === 'warm') await prepare(page, op.warmup)
      await page.tracing.start({ categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink.user_timing', 'v8.execute', 'disabled-by-default-v8.gc'] })
      const t = await clickOp(page, op.click)
      const buf = await page.tracing.stop()
      await page.close()
      const trace = JSON.parse(Buffer.from(buf).toString())
      fs.writeFileSync(path.join(outDir, `${opName}-${mode}.trace.json`), JSON.stringify(trace))
      const tb = traceBreakdown(trace)
      opRes.trace[mode] = tb
      if (!tb) { say(`trace ${mode}: marks not found`); continue }
      say(`\n### trace ${opName} ${mode}: main-thread self time by event between op-start and op-end (window ${fmt(tb.windowMs)} ms; click handler ${fmt(t.syncMs)} ms)`)
      for (const r of tb.rows.slice(0, 18)) say(`  ${rpad(fmt(r.selfMs), 8)} ms self  ${rpad(fmt(r.totalMs), 8)} ms total  ${r.name}`)
    }

    // ---- 4. allocation: sampling heap profiler (all allocations incl. collected) + retained bytes after GC
    if (SECTIONS.has('alloc')) {
      const page = await freshPage(1)
      const client = await page.createCDPSession()
      await prepare(page, op.setup)
      await client.send('HeapProfiler.enable')
      await client.send('HeapProfiler.collectGarbage')
      const before = await page.evaluate(() => performance.memory.usedJSHeapSize)
      await client.send('HeapProfiler.startSampling', { samplingInterval: 256, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true })
      const t = await clickOp(page, op.click)
      const { profile } = await client.send('HeapProfiler.stopSampling')
      await client.send('HeapProfiler.collectGarbage')
      const after = await page.evaluate(() => performance.memory.usedJSHeapSize)
      await page.close()
      const newRows = expectedRows - rowsAfter(op.setup)
      const hs = aggregateHeapSampling(profile)
      opRes.heapSampling = { totalBytes: hs.totalBytes, byFn: hs.byFn.slice(0, 40) }
      opRes.retained = { beforeBytes: before, afterBytes: after, perNewRow: (after - before) / newRows }
      say(`\n### allocation ${opName} (${newRows} new rows; click handler ${fmt(t.syncMs)} ms with sampling heap profiler attached)`)
      say(`sampled JS heap allocation during op: ${(hs.totalBytes / 1024).toFixed(0)} KB total, ${(hs.totalBytes / newRows).toFixed(0)} bytes per new row (estimate from 256-byte sampling, includes garbage)`)
      say(`retained JS heap after GC: ${((after - before) / 1024).toFixed(0)} KB, ${((after - before) / newRows).toFixed(0)} bytes per new row (usedJSHeapSize, includes DOM wrapper objects, not Blink C++ nodes)`)
      say('top allocating functions (sampled bytes):')
      for (const [k, b] of hs.byFn.slice(0, 25)) say(`  ${rpad((b / 1024).toFixed(0), 7)} KB  ${rpad((b / newRows).toFixed(0), 6)} B/row  ${k}`)
    }
  }

  // ---- 5. heap snapshot class counts: delta between empty table and 1000 rows, divided by 1000
  if (SNAPSHOT) {
    const page = await freshPage(1)
    const client = await page.createCDPSession()
    await client.send('HeapProfiler.enable')
    await client.send('HeapProfiler.collectGarbage')
    const base0 = await heapSnapshotCounts(client)
    await clickQuiet(page, 'run')
    await client.send('HeapProfiler.collectGarbage')
    const after = await heapSnapshotCounts(client)
    await page.close()
    const d = diffCounts(base0, after)
    results.snapshot = d.slice(0, 80)
    const totalBytes = d.reduce((s, r) => s + r.bytes, 0); const totalCount = d.reduce((s, r) => s + r.count, 0)
    say(`\n\n## heap snapshot delta, create 1k (per row: counts and retained bytes; ${totalCount / 1000} objects and ${(totalBytes / 1000).toFixed(0)} bytes per row in total)`)
    say(`  ${rpad('objs/row', 9)} ${rpad('B/row', 7)}  type:name`)
    for (const r of d.slice(0, 45)) say(`  ${rpad((r.count / 1000).toFixed(2), 9)} ${rpad((r.bytes / 1000).toFixed(0), 7)}  ${r.name}`)
  }

  // ---- 6. micro experiments (time + retained bytes per item), 3 reps each, N=1000
  if (SECTIONS.has('exp')) {
    const N = 1000
    const page = await freshPage(1)
    const client = await page.createCDPSession()
    await client.send('HeapProfiler.enable')
    const names = await page.evaluate(() => __exp.names)
    say(`\n\n## micro experiments (N=${N}, 3 reps each: ms per rep, retained bytes per item after GC)`)
    for (const name of names) {
      const ms = []; const bytes = []
      for (let r = 0; r < 3; r++) {
        await client.send('HeapProfiler.collectGarbage')
        const b0 = await page.evaluate(() => performance.memory.usedJSHeapSize)
        const t = await page.evaluate((name, n) => __exp.run(name, n), name, N)
        await client.send('HeapProfiler.collectGarbage')
        const b1 = await page.evaluate(() => performance.memory.usedJSHeapSize)
        await page.evaluate(() => __exp.release())
        ms.push(t); bytes.push((b1 - b0) / N)
      }
      results.experiments[name] = { ms, bytesPerItem: bytes }
      say(`  ${pad(name, 48)} ms: ${ms.map(x => fmt(x, 2)).join(' / ')}   bytes/item: ${bytes.map(x => x.toFixed(0)).join(' / ')}`)
    }
    await page.close()
  }

  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2))
  fs.writeFileSync(path.join(outDir, 'report.md'), report.join('\n'))
  say(`\nraw profiles, traces and results.json written to ${outDir}`)
  await browser.close()
  server.close()
}

main().catch(e => { console.error(e); process.exit(1) })
