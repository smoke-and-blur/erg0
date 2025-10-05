# erg0 🌐

A tiny, opt-in DOM micro-framework that plays nicely with your existing stack. Bring it in when you want expressive templating sugar, live bindings, and ergonomic events—leave it out when you don't. erg0 runs on vanilla browser APIs, slips into any framework, and stays server-rendering friendly.

## ✨ Why you'll like it
- 🧩 **Drop-in optionality** – sprinkle `erg0` helpers next to hand-written DOM without rewriting anything.
- 🧪 **Pure vanilla compatibility** – zero build steps, zero globals beyond `erg0`, 100% plain JS.
- 🔄 **State sync on demand** – call `notify()` to fan updates out to registered elements.
- 🪄 **Template ergonomics** – `tags`, `props`, and `events` proxies give you JSX-like expressiveness without a compiler.
- 🌍 **Server-first ready** – hydrate server-rendered markup by reusing IDs/classes, then attach listeners client-side.
- 🤝 **Framework-friendly** – embed within React, Vue, Svelte, Astro, HTMX, or plain HTML; it's just DOM nodes.

## 🚀 Quick start
```html
<script src="erg0.js"></script>
<script>
    const { tags, props, events, reg } = erg0
    const { div, button, span } = tags
    const { className } = props
    const { onclick } = events

    let count = 0

    const counter = () => {
        const label = span(`Clicked ${count} times`)
        const update = () => label.textContent = `Clicked ${count} times`
        return reg(div(
            className`counter`,
            label,
            button(onclick(() => { count++; erg0.notify() }), "Bump")
        ), update)
    }

    document.querySelector('#app').append(counter())
</script>
```

## 🧱 Optional building blocks
- `erg0.tag(ns, name, ...args)` – create any element or SVG tag with strings, nodes, or prop objects.
- `erg0.tags` – a Proxy that auto-generates tag helpers (`tags.div`, `tags.svg`, etc.).
- `erg0.props` – template literal helpers for safe prop strings (`props.className`, `props.style`).
- `erg0.events` – event factories that auto-call `notify()` (or skip it when you pass `false`).
- `erg0.reg(el, update)` – register an element with its update function for manual invalidation.
- `erg0.notify()` – flush pending element updates; prunes detached nodes so you stay leak-free.

Use the pieces you want. Ignore the rest. No bundler? No problem. Need TypeScript types? Add a `.d.ts`—the API surface is tiny.

## 🔄 Smart Props Merging
erg0 automatically merges `className` and `style` props when multiple prop objects are passed:

```javascript
const baseStyles = { className: "box" };
const theme = { className: "dark rounded" };
const highlight = { className: "highlight" };

// Classes are merged and deduplicated
div(baseStyles, theme, highlight, "Text")
// Result: <div class="box dark rounded highlight">Text</div>

// Styles can be merged as strings or objects
div(
    { style: "color: blue; padding: 10px" },
    { style: "background: white" },
    { style: { color: "darkblue" } }, // Overrides color
    "Styled text"
)
```

This makes it easy to compose reusable style patterns, conditional classes, and theme systems without manual concatenation. See `demo-merge-props/` for interactive examples.

## 🌐 Server rendering & hydration
erg0 happily reuses server-rendered markup. Render your HTML on the server, serve it fast, then on the client:
1. select existing nodes,
2. attach events with `erg0.events`,
3. register for updates only where you need reactivity.

No diffing, no virtual DOM. You stay in control of when and how the DOM changes.

## 🛠️ Plays well with others
- **React/Vue/Svelte** – drop into lifecycle hooks to enhance parts of the tree.
- **Astro/Eleventy/Nuxt** – let erg0 handle interactivity while the host handles HTML.
- **HTMX/Alpine** – combine with progressive enhancement strategies.
- **Vanilla JS** – of course. Everything is just `document.*` under the hood.

## 📦 Shipping checklist
- Serve `erg0.js` (or bundle it) wherever you need sprinkles of interactivity.
- Call `erg0.notify()` only when state changes; skip automatic runtime overhead.
- Clean up by removing the element—`notify()` auto-prunes disconnected nodes.

Ready to sprinkle some ergonomics on your DOM? Load `erg0.js`, borrow the helpers you like, and stay close to the platform.
