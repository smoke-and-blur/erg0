⚡ `erg0` is a **zero-build**, **browser-native** JavaScript framework<br>
to create complex DOM layouts that react to changes with ease.

```js
<script src="erg0.js"></script>
<script>
const { tags, events, render } = erg0
const { div, button, span } = tags
const { onclick } = events

let n = 0
function App() {
  return div(
    button(onclick(e => n++), '+'),
    span(n)
  )
}

render(App, '#root')
</script>
```

<table><tr><th>📚</th><th>1. IMPORT THE LIBRARY</th></tr></table>

```html
<script src="erg0.js"></script>
```

<table><tr><th>🔌</th><th>2. IMPORT THE <b>PRODUCERS</b></th></tr></table>

`erg0` provides `tags.*` and a few other *producers*.<br>
`tags.*` return `VNodes` and accept special objects (*props*)<br>
from `props.*`, `events.*` and `style`.<br>
These are used to modify `VNode's` attributes.<br>
`style` accepts `css.*` *producers*

```js
const { tags, props, events, css, style, render, notify } = erg0
const { div, button, span, h1 } = tags
const { id, className } = props
const { color, background, display } = css
```

<table><tr><th>✏️</th><th>3. WRITE THE LAYOUT</th></tr></table>

`tags.*` accept strings, numbers, other `VNodes`<br>
and *props* in any order.

```js
// define our own App "component"
function App() {
  return div(
    h1('Counter'),
    button('+'),
    span(0)
  )
}
```

<table><tr><th>🎨</th><th>4. ADD <b>PROPS</b></th></tr></table>

`tags.*` concatenate multiple `className` *props*<br>
and overwrite any other *props*.<br>
There are multiple types of syntax allowed for `props.*`. 

```js
const { id, className } = props

id`myID` // tag template version

className('myID') // regular function version

div(
    className`button`,
    className`active`, // classNames provided multiple times are concatenated
)
```

`style` is a *prop* producer accepting `css.*`.

```js
style(
    color`blue`,
    display`block`,
)
```

<table><tr><th>⚡</th><th>5. MODIFY STATE</th></tr></table>

`events.*` attach event listeners and<br>
make DOM updates happen when they are triggered.<br>
Provide a falsy value as a second argument<br>
to an `events.*` function to suppress DOM updates.<br>
Use `notify` to forcefully update DOM.

```js
onclick(e=>alert('hello'), false) // will not trigger DOM updates

setInterval(() => {
  count++
  notify() // will trigger DOM updates
}, 1000)
```

> [!TIP]
> A cool trick is to use `!notify` as a falsy value to make it more descriptive:

```js
onclick(e=>alert('hello'), !notify) // will not trigger DOM updates
```

```js
let count = 0

function App() {
  return div(
    h1('Counter'),
    button(
      id('btn'),
      className('round'),
      style(color`blue`),
      onclick(e => count++), // triggers a DOM updates efficiently
      '+'
    ),
    span(count)
  )
}
```

<table><tr><th>✨</th><th>6. RENDER</th></tr></table>

`render` performs the first DOM render.<br>
Subsequent DOM updates are<br>
handled automatically by event producers.

```js
render(App, '#root')
```

<table><tr><th>🥀</th><th>Plain Browser API</th></tr></table>

```js
const app = document.createElement('div')

const header = document.createElement('h2')
header.textContent = 'User List'
app.appendChild(header)

const list = document.createElement('ul')
for (const name of ['Ada', 'Grace', 'Linus']) {
  const li = document.createElement('li')
  li.textContent = name
  list.appendChild(li)
}
app.appendChild(list)

const btn = document.createElement('button')
btn.textContent = 'Add'
btn.onclick = () => alert('clicked')
app.appendChild(btn)

document.querySelector('#root').appendChild(app)
```

<table><tr><th>⚡</th><th><code>erg0</code></th></tr></table>

```js
const { tags, events, render } = erg0
const { div, h2, ul, li, button } = tags
const { onclick } = events

function App() {
  return div(
    h2('User List'),
    ul(['Ada', 'Grace', 'Linus'].map(name => li(name))),
    button(onclick(() => alert('clicked')), 'Add')
  )
}

render(App, '#root')
```
