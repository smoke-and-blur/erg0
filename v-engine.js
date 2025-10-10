// v-engine.js
// Minimal Virtual DOM engine (no modules, no props abstraction)

function node(vnode) {
    if (vnode == null) return document.createTextNode("");

    if (vnode instanceof VText) return document.createTextNode(vnode.text);

    const el = document.createElement(vnode.tag);

    // Apply attributes
    for (const [k, v] of Object.entries(vnode.attrs || {})) {
        if (v === true) el.setAttribute(k, "");
        else if (v === false || v == null) continue;
        else el.setAttribute(k, v);
    }

    // Apply handlers (events)
    for (const [event, handler] of Object.entries(vnode.handlers || {})) {
        el.addEventListener(event, handler);
    }

    // Children
    for (const c of vnode.children || []) {
        el.appendChild(node(c));
    }

    vnode.el = el;

    return el;
}

class VNode {
    constructor(tag, handlers = {}, attrs = {}, ...children) {
        this.tag = tag;
        this.attrs = attrs;
        this.handlers = handlers;
        this.children = flatten(children);
        this.el = null;
    }
}

class VText {
    constructor(text) {
        this.text = String(text);
        this.el = null;
    }
}

function flatten(children) {
    return children.flat(Infinity)
        .filter(c => c || c === 0)
        .map(c => (typeof c === "string" || typeof c === "number") ? new VText(c) : c);
}

class Attr { constructor(o) { Object.assign(this, o); } }
class Handler { constructor(o) { Object.assign(this, o); } }

function normalize(strings, values) {
    return strings.reduce((acc, s, i) => acc + s + (values[i] ?? ""), "").trim();
}

// Attribute proxy
const attrs = new Proxy({}, {
    get: (_, key) => (strings, ...values) => {
        const text = normalize(strings, values);
        return new Attr({ [key]: text || true });
    }
});

// Handlers proxy — user writes handlers.onclick(() => ...)
const handlers = new Proxy({}, {
    get: (_, key) => {
        if (!key.startsWith("on")) {
            throw new Error(`Event must start with 'on', e.g. onclick`);
        }
        const event = key.slice(2); // remove "on"
        return fn => new Handler({ [event]: fn });
    }
});

// Tag proxy — e.g., tags.div(...)
const tags = new Proxy({}, {
    get: (_, tag) => (...args) => {
        let handlersObj = {}, attrsObj = {}, children = [];
        for (const arg of args) {
            if (!arg && arg !== 0) continue;
            if (arg instanceof Handler) Object.assign(handlersObj, arg);
            else if (arg instanceof Attr) Object.assign(attrsObj, arg);
            else children.push(arg);
        }
        return new VNode(tag, handlersObj, attrsObj, ...children);
    }
});

// expose globally
window.node = node;
window.VNode = VNode;
window.VText = VText;
window.attrs = attrs;
window.handlers = handlers;
window.tags = tags;
