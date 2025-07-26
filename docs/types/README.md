@srfnstack/fntags / [Modules](modules.md)

<p align="center">
  <img alt="fntags header" src="https://raw.githubusercontent.com/SRFNStack/fntags/master/docs/fntags_header.gif">
</p>

---

## What the f?
fntags primary goal is to make the developer experience pleasant while providing high performance and neato features.

- No dependencies and no build tools
  <br> - Import the framework directly from your favorite cdn and start building.

- Everything is javascript
  <br> - There's no special templating language to learn, and you won't be writing html. <br> - This removes the template+functionality duality and helps keep you focused by removing context switching.

- Real DOM elements
  <br> - Every element is a real dom element, there's no virtual dom and no wrapper objects.

- It's familiar
  <br> - fntags was inspired by React, and the state management is similar to react hooks.

- [State binding is explicit and granular](https://srfnstack.github.io/fntags/state#Binding%20State)
  <br> - Bind only the text of an element, an attribute, or a style. You control the binding, replace as much or as little as you want.

- State exists without components
  <br> - This allows app wide states to be maintained using export/import and removes the need for complex state management like redux.
  
- [Dynamic routing](https://srfnstack.github.io/fntags/routing#Dynamic%20Path%20Based%20Routing%3A%20modRouter)
  <br> - The modRouter only loads the files required by each route and doesn't require bundling.
  <br> - Bye bye fat bundles, hello highly cacheable routes.

- [Async Rendering](https://srfnstack.github.io/fntags/components#Async%20Rendering)
  <br> - fntags will resolve promises that are passed to element functions, no special handling required. 

## [Documentation](https://srfnstack.github.io/fntags)
Check out the [documentation](https://srfnstack.github.io/fntags) to learn more!

### f'n examples
<hr>

Start a new app with one file
```html
<html><body>
<script type="module">
import { div } from 'https://cdn.jsdelivr.net/npm/@srfnstack/fntags@0.4.1/src/fnelements.min.mjs'
  
document.body.append(div('Hello World!'))
</script>
</body></html>
```

Make re-usable, customizable components using plain js functions
```javascript
const hello = name => div('Hello ', name)

document.body.append( hello('world!') )
```

Explicit two-way state binding
```javascript
import { fnstate } from 'https://cdn.jsdelivr.net/npm/@srfnstack/fntags@0.4.1/src/fntags.min.mjs'
import { div, input, br } from 'https://cdn.jsdelivr.net/npm/@srfnstack/fntags@0.4.1/src/fnelements.min.mjs'

const helloInput = () => {
  const name = fnstate('World')

  const nameInput = input({
    value: name.bindAttr(),
    oninput (){ name(nameInput.value) }
  })

  return div(
    div('Hello ', name.bindAs(), '!'),
    br(),
    nameInput
  )
}

document.body.append(helloInput())
```

### Benchmark
Check the latest benchmark results in the widely used [JS Web Frameworks Benchmark](https://krausest.github.io/js-framework-benchmark/current.html)!
