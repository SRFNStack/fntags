@srfnstack/fntags / [Exports](modules.md)

<p align="center">
  <img alt="fntags header" src="https://raw.githubusercontent.com/SRFNStack/fntags/master/docs/fntags_header.gif">
</p>

---
# fntags is for building faster

- No dependencies

- No build tools

- Everything is javascript

- Real DOM elements

- Inspired by React

- State exists without components

- [State binding is explicit and granular](https://srfnstack.github.io/fntags/state#Binding%20State)
  
- [Dynamic routing](https://srfnstack.github.io/fntags/routing#Dynamic%20Path%20Based%20Routing%3A%20modRouter)

- [Async Rendering](https://srfnstack.github.io/fntags/components#Async%20Rendering)

## [Documentation](https://srfnstack.github.io/fntags)
Check out the [documentation](https://srfnstack.github.io/fntags) for free cookies (not really, sorry not sorry)

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
