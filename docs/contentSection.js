import { div, h3, hr, p, section, span, textarea } from './fntags.js'

export default ( title, ...content ) => section(
    h3( { id: title }, title,
        span( {
            style: 'cursor: pointer',
            title: 'Copy to Clipboard',
                  onclick: (e) => {
                      const node = textarea( {
                                                 readonly: '',
                                                 style: 'position: absolute; left: -9999px'
                                             }, `${location.href}#${encodeURIComponent( title )}` )

                      document.body.appendChild(node);
                      node.select()
                      document.execCommand('copy')
                      document.body.removeChild(node)

                      const toast = div({
                                            style: `
                                            box-shadow: 0px 0px 3px 0px rgba(0,0,0,0.75);
                                            background: white;
                                            padding: 3px;
                                            border-radius: 3px;
                                            position: fixed;
                                            top: ${e.clientY};
                                            left: ${e.clientX+20};
                                            font-size: 14px;
                                            `
                                        },
                                        'Copied to Clipboard')
                      document.body.appendChild(toast)
                      setTimeout(()=>document.body.removeChild(toast), 1000)
                  }
              },
              ' \uD83D\uDD17'
        ) ),
    ...
        content.map( c => typeof c === 'string' ? p( c ) : c ),
    hr()
)