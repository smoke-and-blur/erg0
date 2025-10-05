# erg0 🌐

A lightweight DOM framework focused on composability and developer ergonomics. Build reactive UIs with tagged template literals and intelligent prop merging, using vanilla JavaScript and browser APIs.

## ✨ Features
- 🧩 **Composable** – Use alongside existing code without rewriting. Works with any framework or plain HTML.
- 🧪 **Zero dependencies** – No build steps required. Just vanilla JavaScript.
- 🔄 **Manual updates** – Call `notify()` when you need to update. No automatic diffing overhead.
- 🪄 **Expressive syntax** – Tagged template literals and proxy-based helpers for clean, readable code.
- 🌍 **Server-friendly** – Works with server-rendered markup. Attach events and reactivity client-side.
- 🤝 **Framework agnostic** – Use with React, Vue, Svelte, Astro, HTMX, or standalone.

## 🚀 Quick Start
```html
<script src="erg0.js"></script>
<script>
    const { tags, props, events, render } = erg0;
    const { div, button, p } = tags;
    const { className } = props;
    const { onclick } = events;

    let count = 0;

    function App() {
        return div(
            className`counter`,
            p(`Count: ${count}`),
            button(onclick(() => count++), "Increment")
        );
    }

    render(App, document.getElementById('app'));
</script>
```

## 🧱 Core API
- **`erg0.tags`** – Proxy that generates element builders (`div`, `button`, `svg`, etc.)
- **`erg0.props`** – Tagged template helpers for props (`className`, `style`, `id`, etc.)
- **`erg0.css`** – Tagged template helpers for CSS properties (`background`, `color`, `padding`, etc.)
- **`erg0.events`** – Event handlers with automatic `notify()` calls (`onclick`, `oninput`, etc.)
- **`erg0.render(component, parent)`** – Render a component function into a DOM element
- **`erg0.notify(parent)`** – Manually trigger updates for rendered components

The API is minimal by design. Use what you need, ignore the rest.

## 🔄 Intelligent Prop Merging
Multiple prop objects are automatically merged with smart handling for specific attributes:

**className** – Combined and deduplicated
```javascript
div(
    className("box"),
    className("rounded"),
    className("shadow"),
    "Content"
)
// → <div class="box rounded shadow">Content</div>
```

**style** – Merged with later values overriding
```javascript
const { background, color, padding } = erg0.css;

div(
    style(background`#f0f0f0`, padding`20px`),
    style(color`navy`),
    "Styled content"
)
```

**dataset** – Data attributes merged into one object
```javascript
div(
    dataset({ userId: "123" }),
    dataset({ role: "admin" }),
    "User info"
)
// → <div data-user-id="123" data-role="admin">User info</div>
```

**Event handlers** – Chained in order
```javascript
button(
    onclick(() => console.log("First"), false),
    onclick(() => console.log("Second")),
    "Click me"
)
// Both handlers execute when clicked
```

**rel** – Combined for links
```javascript
a(
    rel`noopener`,
    rel`noreferrer`,
    { href: "https://example.com" },
    "Link"
)
// → <a rel="noopener noreferrer" href="...">Link</a>
```

See `demo-prop-merging/` for complete examples.

## � Enhanced Syntax
The new syntax provides cleaner ways to work with props:

**Multiple class names**
```javascript
className("btn", "primary", "large")
// Instead of: className`btn primary large`
```

**CSS properties with tagged templates**
```javascript
const { background, color, border } = erg0.css;

style(
    background`linear-gradient(...)`,
    color`white`,
    border`1px solid navy`
)
// Cleaner than: style`background: ...; color: white; border: ...`
```

Both old and new syntax work together. See `demo-new-syntax/` for examples.

## 🌐 Server Rendering
erg0 works with server-rendered HTML. Render on the server, then enhance client-side:

1. Server sends static HTML
2. Client selects existing elements
3. Attach event handlers with `erg0.events`
4. Use `render()` only where reactivity is needed

No virtual DOM or automatic diffing. You control when updates happen.

## 🛠️ Framework Integration
- **React/Vue/Svelte** – Use in lifecycle hooks or for specific interactive components
- **Astro/Eleventy/Next.js** – Handle interactivity while the framework manages routing
- **HTMX/Alpine** – Combine with progressive enhancement patterns
- **Vanilla JS** – Direct DOM manipulation with better ergonomics

## 📦 Usage
Include the script:
```html
<script src="erg0.js"></script>
```

Or import as a module:
```javascript
import { tags, props, events, render } from './erg0.js';
```

Call `notify()` when state changes to trigger updates. Removed elements are automatically cleaned up.
