# fntags

> less fluss, more stuff

### [Documentiaton](https://narcolepticsnowman.github.io/fntags)

- No set up and no build process
- Create re-usable elements
- Bind state changes to elements
- Routing for single page apps

```html
<html><body>
<script type="module">
    import {fnstate} from './fntags.js'
    import {div, p, h1} from './fnelements.js'
    
    const welcome = fnstate('Welcome')


    document.body.append(
        div(
            welcome.bindAs(()=>h1(welcome())),
            p("to fntags")
        )
    ) 
</script>
</body></html>
```