# fntags local benchmark loop

A fast, repeatable way to measure the working tree copy of `src/fntags.mjs`
with the operations and measurement method of krausest's
[js-framework-benchmark](https://github.com/krausest/js-framework-benchmark).

Two tools, both driven from a local checkout of the benchmark repo
(`../../../js-framework-benchmark` by default, override with `--bench-root` or
`$JSFB_ROOT`):

1. `run.mjs` (this directory): a lightweight harness in plain ESM that uses
   puppeteer-core and the system Chrome. One command, prints a table, writes
   JSON. This is the day to day loop.
2. The official runner in `js-framework-benchmark/webdriver-ts`, for when you
   want numbers produced by the exact upstream code.

Both measure the benchmark bundle at
`js-framework-benchmark/frameworks/keyed/fntags/dist/Main.js`, which is now
built from the working tree (see below), so an edit to `src/fntags.mjs`
followed by a run is all it takes.

## Setup (once)

```sh
cd scripts/bench
npm install
```

Chrome must exist at `/Applications/Google Chrome.app` (or pass `--chrome` /
`$CHROME_PATH`). Nothing is added to the fntags root package.json.

## The bundle is built from the working tree

`rollup.fntags.mjs` bundles the benchmark's
`frameworks/keyed/fntags/src/Main.js` with `@srfnstack/fntags` resolved to
this checkout's `src/fntags.mjs` instead of the npm package, writing the
result to that entry's `dist/Main.js`. The benchmark repo itself is not
edited, so it stays clean for upstream PRs. Only `fntags.mjs` is aliased, not
`index.js`, because `index.js` also re-exports `fnroute.mjs`, which has module
level side effects that would be bundled into the benchmark.

`run.mjs` rebuilds the bundle automatically whenever `fntags` is among the
frameworks (`--no-build` skips it, `--build` forces it). To rebuild by hand,
or to bundle another copy of fntags:

```sh
npm run build-fntags
FNTAGS_SRC=/path/to/fntags.mjs npm run build-fntags
```

To go back to the published package, run `npm run build-prod` in the
benchmark entry.

Note: the official runner labels results by the version in the entry's
package-lock even though the bundle comes from the working tree.

## Harness: run.mjs

```sh
cd scripts/bench

# fntags, 10 iterations of all 9 CPU benchmarks (rebuilds the bundle first)
node run.mjs --framework fntags --iterations 10

# quick loop on the ops you are working on
node run.mjs -f fntags -n 5 -b 01,07,08

# apples to apples against other frameworks (prints a comparison table too)
node run.mjs -f fntags,vanillajs,vanillajs-lite,mikado,doohtml -n 10

# vanillajs only
node run.mjs --framework vanillajs
```

Options:

| option | meaning |
| --- | --- |
| `--framework, -f a,b` | directories under `frameworks/keyed` (default `fntags`) |
| `--iterations, -n N` | measured runs per benchmark (default 10) |
| `--benchmark, -b 01,07` | substrings matched against benchmark ids (default all 9) |
| `--nothrottling` | turn off the CPU slowdown the official runner applies (4x on 03, 04, 05, 09; 2x on 06) |
| `--headful` | show the browser (default headless=new) |
| `--fresh-browser` | new browser per iteration, as upstream does (slower, default is one browser per framework and a fresh page per iteration) |
| `--traces` | keep every raw Chrome trace under `traces/` |
| `--out, -o file` | JSON path (default `results/<frameworks>-<timestamp>.json`) |
| `--chrome path` | Chrome binary |
| `--bench-root path` | js-framework-benchmark checkout |
| `--verbose, -v` | forward browser console output |

Output: one row per benchmark with median, mean, min, max, stddev of the total
duration, plus median script and paint time, then a comparison table of medians
when several frameworks ran. The JSON contains every run.

### What is measured

Each iteration opens a fresh page, runs the benchmark's init and warmup steps
(ported one to one from `webdriver-ts/src/benchmarksPuppeteer.ts`, same warmup
counts, same selectors, `pierce/` so shadow roots work), applies the official
CPU throttling factor, starts a Chrome trace with the same categories as the
official runner, forces a GC, performs the measured click, waits 100 ms and
stops tracing. The duration is computed like `timeline.ts computeResultsCPU`:
from the `EventDispatch` click event to the end of the first `Commit` after the
last click/FunctionCall/Layout/TimerFire/FireAnimationFrame on the page's
process, with the same requestAnimationFrame delay correction. Script and paint
times are the merged durations of the corresponding trace events inside that
window.

Differences from upstream, chosen for speed: one browser per framework instead
of one per iteration (`--fresh-browser` restores upstream behaviour), and
results are not dropped or trimmed.

Keep the mouse out of the browser window when running `--headful`.

Benchmarks: `01_run1k`, `02_replace1k`, `03_update10th1k_x16`, `04_select1k`,
`05_swap1k`, `06_remove-one-1k`, `07_create10k`, `08_create1k-after1k_x2`,
`09_clear1k_x8`.

### Other frameworks

Any directory under `js-framework-benchmark/frameworks/keyed` with a built
`index.html` works. `vanillajs`, `vanillajs-lite` and `doohtml` ship their
sources directly; `mikado` has a checked in `dist/main.js`. For others run
their `npm run build-prod` first (or `npm run rebuild -- keyed/<name>` from the
benchmark root).

## Official runner

The benchmark http server must be running (port 8080):

```sh
cd ../js-framework-benchmark && npm start
```

Then, in another shell:

```sh
cd ../js-framework-benchmark/webdriver-ts
# compile once if dist/ is missing: npm run compile

# fntags, 3 CPU benchmarks, 5 iterations, headless
npm run bench -- --framework keyed/fntags --headless --benchmark 01_run1k 07_create10k 08_create1k-after1k --count 5

# fntags, every benchmark (CPU, memory, startup, size), default 15 iterations
npm run bench -- --framework keyed/fntags --headless

# fntags against vanillajs
npm run bench -- --framework keyed/fntags keyed/vanillajs --headless --count 10
```

`--headless` is a plain boolean flag (no `true` after it). Results land in
`webdriver-ts/results/<framework>_<benchmark>.json`, traces in
`webdriver-ts/traces/`. The runner uses puppeteer-core with the system Chrome,
so the pinned chromedriver version does not matter. Remember to rebuild the
bundle (`npx rollup -c` in the fntags entry) before running it; the official
runner does not do that for you.

## Known state of the working tree (Oct 2026)

With the current working tree, benchmarks `03_update10th1k_x16` and
`06_remove-one-1k` fail in init for both the harness and the official runner
(`n is not a function` on update, `t is not a function` on remove). Since
commit `0924ab1` (bindChildren no longer wraps the user's array items in
fnstates), `data()` returns plain objects, while the benchmark entry's
`src/Main.js` still does `d()` on each item in the update handler and
`d().id` in `removeRow`. The published 1.1.0 passes both. Either the entry's
Main.js has to be adapted to the new API or the old behaviour restored; the
harness reports `n/a` for those rows until then.

`results/baseline.json` holds the first full baseline (fntags working tree,
vanillajs, vanillajs-lite, mikado, doohtml, 10 iterations).
