import { div, p } from './lib/fnelements.mjs'
import contentSection from './contentSection.js'
import generatedApi from './generatedApi.js'

export default div(
  contentSection(
    'API Reference',
    p('A comprehensive reference for the core functions and modules exported by fntags.'),
    p('This documentation is automatically generated from the source code.')
  ),
  generatedApi
)
