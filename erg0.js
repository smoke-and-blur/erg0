class VNode {
    constructor(tag, handlers = {}, attrs = {}, ...children) {
        this.tag = tag;
        this.attrs = attrs;
        this.handlers = handlers;
        this.children = flatten(children);
        this.el = null;
        this._boundHandlers = {};
        this._notify = null;
        this._autoNotifyMap = {};
    }
}

class VText {
    constructor(text) {
        this.text = String(text);
        this.el = null;
    }
}

class Attr {
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
}

class Handler {
    constructor(event, fn, autoNotify = true) {
        this.event = event;
        this.fn = fn;
        this.autoNotify = autoNotify;
    }
}

function flatten(children) {
    return children.flat(Infinity)
        .filter(c => c || c === 0)
        .map(c => (typeof c === "string" || typeof c === "number") ? new VText(c) : c);
}

function normalize(strings, values) {
    return strings.reduce((acc, s, i) => acc + s + (values[i] ?? ""), "").trim();
}

const attrs = new Proxy({}, {
    get: (_, key) => (strings, ...values) => {
        const text = normalize(strings, values);
        return new Attr(key, text || true);
    }
});

const handlers = new Proxy({}, {
    get: (_, key) => {
        if (!key.startsWith("on")) {
            throw new Error(`Event must start with 'on', e.g. onclick`);
        }
        const event = key.slice(2);
        return (fn, autoNotify = true) => new Handler(event, fn, autoNotify);
    }
});

const tags = new Proxy({}, {
    get: (_, tag) => (...args) => {
        let handlersObj = {}, attrsObj = {}, children = [];
        let autoNotifyMap = {};

        for (const arg of args) {
            if (!arg && arg !== 0) continue;
            if (arg instanceof Handler) {
                handlersObj[arg.event] = arg.fn;
                autoNotifyMap[arg.event] = arg.autoNotify;
            }
            else if (arg instanceof Attr) {
                // Concatenate multiple attrs with same key
                if (attrsObj[arg.key]) {
                    attrsObj[arg.key] = attrsObj[arg.key] + " " + arg.value;
                } else {
                    attrsObj[arg.key] = arg.value;
                }
            }
            else children.push(arg);
        }

        const vnode = new VNode(tag, handlersObj, attrsObj, ...children);
        vnode._autoNotifyMap = autoNotifyMap;
        return vnode;
    }
});

function create(vnode, notify = null) {
    if (vnode == null) return document.createTextNode("");

    if (vnode instanceof VText) {
        const textNode = document.createTextNode(vnode.text);
        vnode.el = textNode;
        return textNode;
    }

    vnode._notify = notify;

    const el = document.createElement(vnode.tag);

    for (const [k, v] of Object.entries(vnode.attrs || {})) {
        if (v === true) el.setAttribute(k, "");
        else if (v === false || v == null) continue;
        else el.setAttribute(k, v);
    }

    vnode._boundHandlers = {};
    for (const [event, handler] of Object.entries(vnode.handlers || {})) {
        const autoNotify = vnode._autoNotifyMap?.[event] !== false;
        const wrappedHandler = (...args) => {
            handler(...args);
            if (autoNotify && notify) {
                notify();
            }
        };
        vnode._boundHandlers[event] = wrappedHandler;
        el.addEventListener(event, wrappedHandler);
    }

    for (const c of vnode.children || []) {
        el.appendChild(create(c, notify));
    }

    vnode.el = el;
    return el;
}

function cleanup(vnode) {
    if (vnode._boundHandlers && vnode.el) {
        for (const [event, handler] of Object.entries(vnode._boundHandlers)) {
            vnode.el.removeEventListener(event, handler);
        }
    }
    if (vnode.children) {
        for (const child of vnode.children) {
            if (child instanceof VNode) {
                cleanup(child);
            }
        }
    }
}

function patchChildren(parent, oldChildren, newChildren, notify) {
    const len = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < len; i++) {
        const oldC = oldChildren[i];
        const newC = newChildren[i];

        if (!oldC && newC) {
            parent.appendChild(create(newC, notify));
            continue;
        }

        if (oldC && !newC) {
            if (oldC instanceof VNode) {
                cleanup(oldC);
            }
            parent.removeChild(oldC.el);
            continue;
        }

        if (oldC instanceof VText && newC instanceof VText) {
            if (oldC.text !== newC.text) oldC.el.nodeValue = newC.text;
            newC.el = oldC.el;
            continue;
        }

        if ((oldC instanceof VText && newC instanceof VNode) ||
            (oldC instanceof VNode && newC instanceof VText)) {
            if (oldC instanceof VNode) cleanup(oldC);
            parent.replaceChild(create(newC, notify), oldC.el);
            continue;
        }

        if (oldC instanceof VNode && newC instanceof VNode) {
            patch(oldC, newC, parent, notify);
        }
    }
}

function patch(oldVNode, newVNode, parent, notify) {
    if (oldVNode.tag !== newVNode.tag) {
        cleanup(oldVNode);
        parent.replaceChild(create(newVNode, notify), oldVNode.el);
        return;
    }

    const el = (newVNode.el = oldVNode.el);
    newVNode._notify = notify;
    newVNode._autoNotifyMap = newVNode._autoNotifyMap || {};

    for (const k in oldVNode.attrs) {
        if (!(k in newVNode.attrs)) {
            el.removeAttribute(k);
        }
    }

    for (const [k, v] of Object.entries(newVNode.attrs)) {
        if (v === true) el.setAttribute(k, "");
        else if (v === false || v == null) el.removeAttribute(k);
        else if (oldVNode.attrs[k] !== v) el.setAttribute(k, v);
    }

    const oldHandlers = oldVNode._boundHandlers || {};
    const newHandlers = newVNode.handlers || {};
    newVNode._boundHandlers = {};

    for (const event in oldHandlers) {
        if (!(event in newHandlers)) {
            el.removeEventListener(event, oldHandlers[event]);
        }
    }

    for (const [event, handler] of Object.entries(newHandlers)) {
        if (oldHandlers[event]) {
            el.removeEventListener(event, oldHandlers[event]);
        }
        const autoNotify = newVNode._autoNotifyMap?.[event] !== false;
        const wrappedHandler = (...args) => {
            handler(...args);
            if (autoNotify && notify) {
                notify();
            }
        };
        el.addEventListener(event, wrappedHandler);
        newVNode._boundHandlers[event] = wrappedHandler;
    }

    patchChildren(el, oldVNode.children, newVNode.children, notify);
}

function render(container, view) {
    // Create a wrapper VNode that represents empty container
    let currentVNode = new VNode('div'); // dummy tag, won't be used
    currentVNode.children = [];
    currentVNode.el = container;

    function notify() {
        const newVNode = view();
        const wrapperVNode = new VNode('div');
        wrapperVNode.children = [newVNode];
        wrapperVNode.el = container;

        patchChildren(container, currentVNode.children, wrapperVNode.children, notify);
        currentVNode = wrapperVNode;
    }

    notify();
    return notify;
}