import { div } from '../../docs/lib/fnelements.mjs'


describe("fnelements", ()=>{
    it("should create a div with the text hi", ()=>{
        const d = div("hi")
        expect(d.tagName).to.eq("DIV")
        expect(d.innerText).to.eq("hi")
    })
})
