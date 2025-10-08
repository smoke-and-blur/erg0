⚡ `erg0` is a **zero-build**, **browser-native** JavaScript framework to create complex DOM layouts that react to changes with ease. 🧠

<table>
<tr><th>`erg0`</th><th>Plain Browser API</th></tr>
<tr><td>

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

</td><td>

```js
<script>
let n = 0;

const container = document.createElement('div');

const button = document.createElement('button');
button.textContent = '+';

const span = document.createElement('span');
span.textContent = n;

button.onclick = (e) => {
  n++;
  span.textContent = n;
};

container.appendChild(button);
container.appendChild(span);

document.getElementById('root').appendChild(container);
</script>
```

</td></tr>
</table>

## 🧩 Internals

Use `<script>` tag to import the library. It exposes `erg0` object in the global (`window`) scope. 🌍

```js
<script src="erg0.js"></script>
```

The `erg0` object provides `tags`, `attrs`, `events` and `css` proxies, `style`, `render` and `notify` functions. ⚙️

```js
const { tags, attrs, events, css, style, render, notify } = erg0
```

The `tags` proxy allows access to the "factory" functions (like `div`, `button`, `span` etc) returning `VNodes` representing real DOM nodes. These functions do not exist upfront and are created on the fly whenever the user defines them.

This allows creating both existing HTML tags and custom ones. 🧱

```js
const { div, button, span, custom } = tags
```

Let's call these factory functions just *tags* from now on.

Similarly `attrs` are used to attach any attributes and `events` are used to attach any event listeners. Let's just call them *attrs* and *events*.

*Tags* accept strings, numbers, other `VNodes`, *attrs* and *events* to modify the returned `VNode` properties (*props*).

```js
const { id, className } = attrs

div(
    id`myID`, // tag template syntax
    className(`active`), // parenths syntax, both valid
)

div(
    className`button`,
    className`active`, // classNames are a special case: multiple classNames are concatenated
)
```

The `style` function (*style* from now on) is a special case. This is to make it accept objects produced by the `css` proxy factories (*styles*). 🎨

```js
const { color, display } = css

div(
    style(
        color`red`,
        display`flex`,
    ),
)
```

The *events* update DOM automatically when they are triggered (using `notify` function). Provide a falsy value as a second argument to suppress DOM updates. Use `notify` to forcefully update DOM outside of any *events*. 🔁

```js
onclick(e=>alert('hello'), false) // will not trigger DOM updates

setInterval(() => {
  count++
  notify() // will trigger DOM updates
}, 1000)
```

> [!TIP]
> 💡 A cool trick is to use `!notify` as a falsy value to make it more descriptive:

```js
onclick(e=>alert('hello'), !notify) // will not trigger DOM updates
```

## 🧠 Full Example

```js
let count = 0

function App() {
  return div(
    h1('Counter'),
    button(
      id('btn'),
      className('round'),
      style(color`blue`),
      onclick(e => count++), // triggers DOM updates efficiently
      '+'
    ),
    span(count)
  )
}
render(App, '#root')
```

The `render` function performs the first DOM update. All the subsequent DOM updates are done by the `notify` function. The built-in diff algorithm ensures only changed VNodes trigger DOM updates, leaving unchanged nodes untouched. 🔍

```js
let n = 0

function App() {
    return div('hello', span(n))
}

render(App, '#root')

notify() // nothing is changed at all

n = 10

notify() // only the span DOM element is going to be updated
```

✅ **Enjoy!** 🚀