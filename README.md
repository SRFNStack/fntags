<p align="center">
  <img alt="fntags header" src="https://raw.githubusercontent.com/SRFNStack/fntags/master/docs/fntags_header.gif">
</p>

---

# fntags

A lightweight, no-build ES6 framework for building fast and reactive web applications.

fntags allows you to build complex, interactive web apps using standard JavaScript and HTML5. No special syntax, no build steps, and no magic.

## Why fntags?

- **No Build Step**: Import the framework directly from a CDN or your file system. No Webpack, no Babel, no headaches.
- **Granular State**: Bind only what needs to change—text, attributes, or styles—for high-performance updates.
- **Standards Based**: Just standard ES6 JavaScript and HTML5. Zero magic syntax to learn.
- **Effortless Debugging**: In fntags, there is no black box. Errors produce clean stack traces that point exactly to your source code.
- **TypeScript Support**: Includes TypeScript definitions out of the box. No need to install separate `@types` packages.
- **Real DOM Elements**: Every element is a real DOM element. No virtual DOM and no wrapper objects.
- **Dynamic Routing**: Built-in path-based routing that only loads files required by each route.

## Documentation

Check out the [full documentation](https://srfnstack.github.io/fntags) to learn more!

## Getting Started

### Option 1: CDN (Recommended for prototyping)

You can use fntags directly in your browser without downloading anything:

```html
<!DOCTYPE html>
<html lang="en">
<body>
    <script type="module">
        import { div } from 'https://cdn.jsdelivr.net/npm/@srfnstack/fntags@1.0.0/src/fnelements.mjs'
        
        document.body.append(
            div("Hello, World!")
        )
    </script>
</body>
</html>
```

### Option 2: NPM

Install via npm:

```bash
npm install @srfnstack/fntags
```

Then import it in your code:

```javascript
import { div } from '@srfnstack/fntags'
```

## Examples

### Re-usable Components

Components in fntags are just functions that return HTML elements.

```javascript
import { div, b } from '@srfnstack/fntags'

// A simple component
const Greeting = (name) => {
    return div( "Hello, ", b(name), "!")
}

document.body.append(
    Greeting("Developer")
)
```

### Explicit State Binding

State binding is explicit and granular. You control exactly what updates.

```javascript
import { fnstate } from '@srfnstack/fntags'
import { div, button } from '@srfnstack/fntags'

const Counter = () => {
    const count = fnstate(0)

    return div(
        div('Count: ', count.bindAs()),
        button({
            onclick: () => count(count() + 1)
        }, 'Increment')
    )
}

document.body.append(Counter())
```

### Benchmark

Check the latest benchmark results in the widely used [JS Web Frameworks Benchmark](https://krausest.github.io/js-framework-benchmark/current.html)!
