import * as fnelements from '../../docs/lib/fnelements.mjs'

describe("fnelements", ()=>{
    it("should create a div with the text hi", ()=>{
        const d = fnelements.div("hi")
        expect(d.tagName).to.eq("DIV")
        expect(d.innerText).to.eq("hi")
    })
    it("should create the right tag for every kind of standard html element", ()=>{
        const tags = ["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "big", "blockquote", "br", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "iframe", "img", "input", "ins", "kbd", "label", "legend", "li", "link", "main", "map", "mark", "marquee", "menu", "meta", "meter", "nav", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "samp", "script", "section", "select", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "ul", "_var", "video", "wbr"]
        for (let tag of tags) {
            const el = fnelements[tag]()
            expect(el.tagName).to.eq(tag.toUpperCase().replaceAll("_", ""))
        }
    })
    it("should create a use element with the proper namespaces configured", ()=>{
        const el = fnelements.use()
        expect(el.namespaceURI).to.eq("http://www.w3.org/2000/svg")
        expect(el.tagName).to.eq("use")
    })
    it("should create an svg element with the proper namespaces configured", ()=>{
        const el = fnelements.svg()
        expect(el.namespaceURI).to.eq("http://www.w3.org/2000/svg")
        expect(el.tagName).to.eq("svg")
    })
    it("should create a div with the right style for a flex row", ()=>{
        const el = fnelements.flexRow("hi")
        expect(el.tagName).to.eq("DIV")
        expect(el.style.display).to.eq("flex")
        expect(el.style['flex-direction']).to.eq("row")
        expect(el.innerText).to.eq("hi")
    })
    it("should create a div with the right style for a centered flex row", ()=>{
        const el = fnelements.flexCenteredRow("hi")
        expect(el.tagName).to.eq("DIV")
        expect(el.style.display).to.eq("flex")
        expect(el.style['flex-direction']).to.eq("row")
        expect(el.style['align-items']).to.eq('center')
        expect(el.innerText).to.eq("hi")
    })
    it("should create a div with the right style for a flex col", ()=>{
        const el = fnelements.flexCol("hi")
        expect(el.tagName).to.eq("DIV")
        expect(el.style.display).to.eq("flex")
        expect(el.style['flex-direction']).to.eq("column")
        expect(el.innerText).to.eq("hi")
    })
    it("should create a div with the right style for a centered flex col", ()=>{
        const el = fnelements.flexCenteredCol("hi")
        expect(el.tagName).to.eq("DIV")
        expect(el.style.display).to.eq("flex")
        expect(el.style['flex-direction']).to.eq("column")
        expect(el.style['align-items']).to.eq('center')
        expect(el.innerText).to.eq("hi")
    })
})
