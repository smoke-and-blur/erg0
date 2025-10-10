// diff-engine.js
// Patcher that works with vnode.attrs and vnode.handlers directly

function patchChildren(parent, oldChildren, newChildren) {
    const len = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < len; i++) {
        const oldC = oldChildren[i];
        const newC = newChildren[i];

        if (!oldC && newC) {
            parent.appendChild(node(newC));
            continue;
        }

        if (oldC && !newC) {
            parent.removeChild(oldC.el);
            continue;
        }

        if (oldC instanceof VText && newC instanceof VText) {
            if (oldC.text !== newC.text) oldC.el.nodeValue = newC.text;
            newC.el = oldC.el;
            continue;
        }

        if (oldC instanceof VNode && newC instanceof VNode) {
            patch(oldC, newC, parent);
        }
    }
}

function patch(oldVNode, newVNode, parent) {
    // Different tag: replace whole element
    if (oldVNode.tag !== newVNode.tag) {
        parent.replaceChild(node(newVNode), oldVNode.el);
        return;
    }

    const el = (newVNode.el = oldVNode.el);

    // --- ATTRIBUTES ---

    // Remove old attrs
    for (const k in oldVNode.attrs) {
        if (!(k in newVNode.attrs)) {
            el.removeAttribute(k);
        }
    }

    // Add / update attrs
    for (const [k, v] of Object.entries(newVNode.attrs)) {
        if (v === true) el.setAttribute(k, "");
        else if (v === false || v == null) el.removeAttribute(k);
        else if (oldVNode.attrs[k] !== v) el.setAttribute(k, v);
    }

    // --- EVENT HANDLERS ---

    // Remove old handlers
    for (const k in oldVNode.handlers) {
        if (!(k in newVNode.handlers)) {
            el.removeEventListener(k, oldVNode.handlers[k]);
        }
    }

    // Add / update handlers
    for (const [k, v] of Object.entries(newVNode.handlers)) {
        if (oldVNode.handlers[k] !== v) {
            if (oldVNode.handlers[k]) {
                el.removeEventListener(k, oldVNode.handlers[k]);
            }
            el.addEventListener(k, v);
        }
    }

    // --- CHILDREN ---
    patchChildren(el, oldVNode.children, newVNode.children);
}

// expose globally
window.patch = patch;
