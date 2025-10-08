# ⚡ **erg0** — The DOM Manipulation Framework

`erg0` is a **zero-build**, **browser-native** JavaScript framework
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

**1️⃣ Import the library**

```html
<script src="erg0.js"></script>
```

**2️⃣ Import the *producers***

<div style="max-width: 600px;">

`erg0` provides `tags.*` and a few other *producers*.

`tags.*` return `VNodes` and accept special objects (*props*) from `props.*`, `events.*` and `style`. These are used to modify `VNode's` attributes.

`style` accepts `css.*` *producers*

</div>

```js
const { tags, props, events, css, style, render, notify } = erg0
const { div, button, span, h1 } = tags
const { id, className } = props
const { color, background, display } = css
```

**3️⃣ Write the layout**

`tags.*` accept strings, numbers, other `VNodes`, and *props* in any order.

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



<table>
<tr><th>4️⃣ Add attributes and styles</th></tr>

<tr><td>

`tags.*` concatenate multiple `className` *props* and overwrite any other *props*. There are multiple types of syntax allowed for `props.*`. 

</td></tr>

<tr><td>

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

</td></tr>
</table>

**5️⃣ Assign event listeners and modify state**

`events.*` attach event listeners and make DOM updates happen when they are triggered.

Provide a falsy value as a second argument to an `events.*` to suppress DOM updates.

Use `notify` to forcefully update DOM.

```js
onclick(e=>alert('hello'), false) // will not trigger DOM updates

setInterval(() => {
  count++
  notify() // will trigger DOM updates
}, 1000)
```

A cool trick is to use `!notify` as a falsy value to make it more descriptive:

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

**6️⃣ Render**

`render` performs the first DOM render.

Subsequent DOM updates are handled automatically by event producers.

```js
render(App, '#root')
```

**🥀 Plain Browser API**

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

**⚡ `erg0`**

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
