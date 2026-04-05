import { describe, it, expect, beforeEach } from 'vitest'
import { renderToString, renderToStream, escapeScriptContent } from '../src/index.mjs'

async function streamToString (stream) {
  const reader = stream.getReader()
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += value
  }
  return result
}

/**
 * Extract the JS expression assigned to a variable from a script tag in the HTML.
 * e.g. extractAssignment(html, '__FNTAGS_SSR_STATE__') returns the expression string.
 */
function extractAssignment (html, varName) {
  // Match: window.VAR= or VAR= followed by everything until </script>
  const re = new RegExp(`(?:window\\.)?${varName}\\s*=\\s*([\\s\\S]*?)\\s*</script>`, 'i')
  const m = html.match(re)
  return m ? m[1] : null
}

/**
 * Extract the innerHTML assignment expression from a shell replacement script.
 */
function extractInnerHtmlAssignment (html) {
  const re = /\.innerHTML\s*=\s*([\s\S]*?)\s*<\/script>/i
  const m = html.match(re)
  return m ? m[1] : null
}

describe('escapeScriptContent', () => {
  it('is exported and callable', () => {
    expect(typeof escapeScriptContent).toBe('function')
  })

  it('escapes < characters', () => {
    expect(escapeScriptContent('</script>')).toBe('\\u003c/script>')
  })

  it('escapes case-insensitive variants', () => {
    const result = escapeScriptContent('</Script></SCRIPT></sCrIpT>')
    expect(result).not.toContain('</')
  })

  it('handles strings with no special characters', () => {
    expect(escapeScriptContent('hello world')).toBe('hello world')
  })

  it('escapes multiple occurrences', () => {
    const result = escapeScriptContent('<b>bold</b> and <i>italic</i>')
    expect(result).not.toContain('<b')
    expect(result).not.toContain('<i')
  })

  it('must be applied AFTER JSON.stringify for correct round-trip', () => {
    // This test documents the critical ordering requirement.
    // escapeScriptContent replaces < with \u003c (6 literal chars).
    // When \u003c appears directly in JS source, the JS parser treats it as
    // a Unicode escape → the < character. But if JSON.stringify runs AFTER,
    // it escapes \ to \\, and the browser sees \\u003c = literal backslash + text.

    const value = '<p>hello</p>'

    // CORRECT order: JSON.stringify first, then escape
    const correct = escapeScriptContent(JSON.stringify(value))
    // The output should be a valid JS string literal that, when evaluated,
    // produces the original value. We can verify by checking that eval
    // of the expression returns the original string.
    // eslint-disable-next-line no-eval
    expect(eval(correct)).toBe(value)

    // WRONG order: escape first, then JSON.stringify — produces double-escaped output
    const wrong = JSON.stringify(escapeScriptContent(value))
    // eval of the wrong output returns the literal \u003c chars, not <
    // eslint-disable-next-line no-eval
    expect(eval(wrong)).not.toBe(value)
    // eslint-disable-next-line no-eval
    expect(eval(wrong)).toContain('\\u003c')
  })
})

describe('XSS prevention in renderToStream', () => {
  beforeEach(() => {
    globalThis.__fntags_registry = undefined
  })

  it('escapes </script> in state values', async () => {
    const html = await streamToString(renderToStream({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const payload = registeredState('xss', '</script><script>alert(1)</script>')
        return h('div', 'safe')
      }
    }))

    // The raw </script> must not appear unescaped in script tags
    expect(html).toContain('__FNTAGS_SSR_STATE__')

    // Verify no unescaped </script> appears inside any script block content
    const scriptContents = html.match(/<script>([\s\S]*?)<\/script>/gi) || []
    for (const block of scriptContents) {
      const inner = block.replace(/^<script>/i, '').replace(/<\/script>$/i, '')
      expect(inner).not.toMatch(/<\/script/i)
    }
  })

  it('state values round-trip correctly through escaping', async () => {
    const xssPayload = '</script><script>alert(1)</script>'
    const html = await streamToString(renderToStream({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        registeredState('xss', xssPayload)
        registeredState('normal', 'hello')
        registeredState('nested', { html: '<b>bold</b>', script: '</script>' })
        return h('div', 'safe')
      }
    }))

    // Extract the state assignment expression and eval it to verify round-trip
    const expr = extractAssignment(html, '__FNTAGS_SSR_STATE__')
    expect(expr).toBeTruthy()

    // eslint-disable-next-line no-eval
    const recovered = eval(`(${expr})`)
    expect(recovered.xss).toBe(xssPayload)
    expect(recovered.normal).toBe('hello')
    expect(recovered.nested.html).toBe('<b>bold</b>')
    expect(recovered.nested.script).toBe('</script>')
  })

  it('escapes </Script> case variants in state', async () => {
    const html = await streamToString(renderToStream({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        registeredState('xss', '</Script></SCRIPT>')
        return h('div', 'safe')
      }
    }))

    // Neither case variant should appear unescaped in script tag content
    const scriptContents = html.match(/<script>([\s\S]*?)<\/script>/gi) || []
    for (const block of scriptContents) {
      const inner = block.replace(/^<script>/i, '').replace(/<\/script>$/i, '')
      expect(inner).not.toMatch(/<\/script/i)
    }
  })

  it('escapes </script> in resolved promise content', async () => {
    const html = await streamToString(renderToStream({
      url: '/',
      timeout: 3000,
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const delayed = new Promise(resolve =>
          setTimeout(() => resolve(h('div', '</script><img onerror=alert(1)>')), 20)
        )
        return h('div', delayed)
      }
    }))

    // The shell replacement script should have escaped < characters
    expect(html).toContain('fntags-ssr-shell')
    // Raw </script> should not appear inside a script tag's content
    const scriptContents = html.match(/<script>([\s\S]*?)<\/script>/gi) || []
    for (const block of scriptContents) {
      const inner = block.replace(/^<script>/i, '').replace(/<\/script>$/i, '')
      expect(inner).not.toMatch(/<\/script/i)
    }
  })

  it('shell replacement innerHTML round-trips correctly', async () => {
    // This test verifies the innerHTML assignment in the shell replacement
    // script produces correct HTML when evaluated by the browser JS engine,
    // not mangled \u003c text. This catches the escapeScriptContent ordering bug.
    const html = await streamToString(renderToStream({
      url: '/',
      timeout: 3000,
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const delayed = new Promise(resolve =>
          setTimeout(() => resolve(h('span', 'async content')), 20)
        )
        return h('div', h('p', 'sync'), delayed)
      }
    }))

    // Extract the innerHTML assignment expression from the replacement script
    const expr = extractInnerHtmlAssignment(html)
    expect(expr).toBeTruthy()

    // Evaluate the JS expression — it should produce real HTML with < characters,
    // not mangled \u003c text
    // eslint-disable-next-line no-eval
    const recoveredHtml = eval(expr)
    expect(recoveredHtml).toContain('<p>')
    expect(recoveredHtml).toContain('<span>')
    expect(recoveredHtml).toContain('sync')
    expect(recoveredHtml).toContain('async content')
    // Must NOT contain literal \u003c — that would mean the escaping was double-applied
    expect(recoveredHtml).not.toContain('\\u003c')
    expect(recoveredHtml).not.toContain('u003c')
  })

  it('shell replacement innerHTML with </script> in content round-trips', async () => {
    // Text content containing </script> should survive the full round-trip:
    // DOM serialization → escape → JS eval → innerHTML
    const html = await streamToString(renderToStream({
      url: '/',
      timeout: 3000,
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const delayed = new Promise(resolve =>
          setTimeout(() => resolve(h('code', '</script> is dangerous')), 20)
        )
        return h('div', delayed)
      }
    }))

    const expr = extractInnerHtmlAssignment(html)
    expect(expr).toBeTruthy()

    // eslint-disable-next-line no-eval
    const recoveredHtml = eval(expr)
    // The text should contain the literal </script> after round-tripping
    // (the DOM serializes it as &lt;/script&gt; in innerHTML, which is safe HTML)
    expect(recoveredHtml).toContain('&lt;/script&gt;')
    expect(recoveredHtml).toContain('dangerous')
  })
})

describe('XSS prevention in renderToString consumer pattern', () => {
  beforeEach(() => {
    globalThis.__fntags_registry = undefined
  })

  it('escapeScriptContent(JSON.stringify(state)) round-trips correctly', async () => {
    const { state } = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        registeredState('payload', '</script><img onerror=alert(1)>')
        registeredState('nested', { a: '</script>', b: [1, '</SCRIPT>'] })
        return h('div', 'test')
      }
    })

    // This is the pattern we tell users to use in their templates
    const scriptContent = escapeScriptContent(JSON.stringify(state))

    // No literal </script in the output
    expect(scriptContent).not.toMatch(/<\/script/i)

    // The JS expression should eval to the original state
    // eslint-disable-next-line no-eval
    const recovered = eval(`(${scriptContent})`)
    expect(recovered.payload).toBe('</script><img onerror=alert(1)>')
    expect(recovered.nested.a).toBe('</script>')
    expect(recovered.nested.b[1]).toBe('</SCRIPT>')
  })
})
