# fntags

> Javascript instead of html

### [Documentiaton](https://narcolepticsnowman.github.io/fntags)

- No set up and no build process
- Create re-usable elements
- Bind any state to any element
- Bind to more than one state
- Routing for single page apps
- Less than 3kb min+gz

```html
<html><body>
<script type="module">
    import {fnapp, div, p, h1} from './fntags.js'
    fnapp(document.body,
        div(
            h1("Welcome"),
            p("to fntags")
        )
    ) 
</script>
</body></html>
```