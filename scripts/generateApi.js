const fs = require('fs')
const path = require('path')

const typesPath = path.join(__dirname, '../docs/types.json')
const outputPath = path.join(__dirname, '../docs/generatedApi.js')

if (!fs.existsSync(typesPath)) {
  console.error('docs/types.json not found. Run "npm run docs" first.')
  process.exit(1)
}

const types = require(typesPath)

// Helper to escape strings for JS code
const esc = (str) => JSON.stringify(str || '')

let fileContent = `import { div, h3, p, code, ul, li, strong, a } from './lib/fnelements.mjs'
import contentSection from './contentSection.js'

export default div(
`

const getCommentText = (comment) => {
  if (!comment) return ''
  if (comment.summary) {
    return comment.summary.map(s => s.text).join('').trim()
  }
  // Fallback for shortText/text in older typedoc versions if schema varies
  return comment.shortText || comment.text || ''
}

const renderType = (type) => {
  if (!type) return 'any'
  if (type.type === 'intrinsic') return type.name
  if (type.type === 'reference') return type.name
  if (type.type === 'union') return type.types.map(renderType).join(' | ')
  if (type.type === 'array') return renderType(type.elementType) + '[]'
  return 'object' // Simplified
}

const renderSignature = (sig) => {
  const params = (sig.parameters || []).map(p => {
    const pType = renderType(p.type)
    const name = p.name
    const rest = p.flags && p.flags.isRest ? '...' : ''
    const optional = p.flags && p.flags.isOptional ? '?' : ''
    return `${rest}${name}${optional}: ${pType}`
  }).join(', ')

  const retType = renderType(sig.type)

  // We want to show: functionName(param: type): ReturnType
  // But maybe cleaner: functionName(param, param)
  // The user wants "friendly".
  // Let's do: functionName(params)

  const simpleParams = (sig.parameters || []).map(p => {
    const rest = p.flags && p.flags.isRest ? '...' : ''
    return `${rest}${p.name}`
  }).join(', ')

  return `${sig.name}(${simpleParams})`
}

const modules = types.children || []

// Sort modules by priority
const priority = ['fntags', 'fnroute', 'fnelements', 'svgelements']
modules.sort((a, b) => {
  const idxA = priority.indexOf(a.name)
  const idxB = priority.indexOf(b.name)

  if (idxA !== -1 && idxB !== -1) return idxA - idxB
  if (idxA !== -1) return -1
  if (idxB !== -1) return 1
  return a.name.localeCompare(b.name)
})

modules.forEach((mod) => {
  // Filter out internal/junk
  if (!mod.children) return

  fileContent += `    contentSection('Module: ${mod.name}',
`

  const description = getCommentText(mod.comment)
  if (description) {
    fileContent += `        p(${esc(description)}),
`
  }
  const helperFuncs = []

  mod.children.forEach(child => {
    if (mod.name === 'fnelements' && (/[A-Z]/.test(child.name) || child.name.startsWith('flex'))) {
      helperFuncs.push(child)
    }
  })
  if (mod.name === 'fnelements' || mod.name === 'svgelements') {
    fileContent += `        p('This module exports functions for all standard ${mod.name === 'svgelements' ? 'SVG' : 'HTML'} elements.'),
`
    fileContent += `        p('For a full list of available elements, see the ', a({target: 'blank', href: 'https://developer.mozilla.org/en-US/docs/Web/${mod.name === 'svgelements' ? 'SVG/Element' : 'HTML/Element'}'}, 'MDN Documentation'), '.'),
`

    if (helperFuncs.length > 0) {
      fileContent += `        h3('Helper Functions'),
`
      fileContent += `        p('In addition to standard tags, this module provides the following helpers:'),
`

      fileContent += `        p('No helper functions currently exported.'),
`
    }

    helperFuncs.forEach(child => {
      const sig = child.signatures && child.signatures[0]
      if (!sig) return

      const sigStr = renderSignature(sig)
      const desc = getCommentText(sig.comment)

      fileContent += `        h3(code('${sigStr}')),
`
      if (desc) fileContent += `        p(${esc(desc)}),
`
    })

  } else {
    // Standard module (fntags, fnroute)
    mod.children.forEach(child => {
      // We care mostly about functions (signatures) or variables
      let sig = child.signatures && child.signatures[0]
      let desc = ''
      let name = child.name

      if (child.kindString === 'Type alias') {
        // Handle type aliases if useful?
        // Probably skip for friendly docs unless critical.
        return
      }

      if (!sig && child.kind === 64) { // Function but no signature?
        // Typedoc sometimes puts signatures inside.
      }

      if (sig) {
        const sigStr = renderSignature(sig)
        desc = getCommentText(sig.comment)

        fileContent += `        h3(code('${sigStr}')),
`
        if (desc) fileContent += `        p(${esc(desc)}),
`

        // Params details
        if (sig.parameters && sig.parameters.length > 0) {
          fileContent += `        ul(
`
          sig.parameters.forEach(p => {
            const pDesc = getCommentText(p.comment)
            const pType = renderType(p.type)
            fileContent += `            li(strong('${p.name}'), ': ${pType}', ${esc(pDesc ? ' - ' + pDesc : '')}),
`
          })
          fileContent += `        ),
`
        }
      } else if (child.kind === 32) { // Variable (e.g. pathState)
        desc = getCommentText(child.comment)
        fileContent += `        h3(code('${name}')),
`
        if (desc) fileContent += `        p(${esc(desc)}),
`
      }
    })
  }

  fileContent += `    ),
`
})

fileContent += `)
`

fs.writeFileSync(outputPath, fileContent)
console.log('Generated docs/generatedApi.js')
