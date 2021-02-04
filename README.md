# fntags

> less fluff, more stuff

### [Documentation](https://srfnstack.github.io/fntags)

Check the docs to get started, or copy and paste the following example into a html file and load it in your browser!

```html
<html><body>
<script type="module">
    import {fnstate} from 'https://cdn.jsdelivr.net/npm/fntags@0.4.2/src/fntags.min.js'
    import {div, br, h1, input} from 'https://cdn.jsdelivr.net/npm/fntags@0.4.2/src/fnelements.min.js'
    
    const name = fnstate( 'fntags' )

    document.body.append(
      div(
          h1('Hello ', name.bindAs( name )),
          br(),
          input(
              {
                  value: name.bindAttr( name ),
                  oninput:
                      ( e ) => name( e.target.value )
              }
          )
      )
    ) 
</script>
</body></html>
```
