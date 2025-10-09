// erg0 VDOM Framework - Vanilla Browser JS
(function () {
    // VNode class
    class VNode {
        constructor(tag, props = {}, children = []) {
            this.tag = tag;
            this.props = props;
            this.children = flattenChildren(Array.isArray(children) ? children : [children]);
            this.el = null;
        }

        node() {
            const el = document.createElement(this.tag);
            this.el = el;

            for (let [k, v] of Object.entries(this.props)) {
                if (k.startsWith("on") && typeof v === "function") {
                    const eventName = k.slice(2).toLowerCase();
                    el.addEventListener(eventName, v);
                    continue;
                }
                if (k === "className") {
                    el.setAttribute("class", v);
                    continue;
                }
                if (k === "style" && typeof v === "object") {
                    Object.assign(el.style, v);
                    continue;
                }
                if (v === true) {
                    el.setAttribute(k, "");
                    continue;
                }
                if (v !== false && v != null) {
                    if (k in el && k !== 'list' && k !== 'form') {
                        el[k] = v;
                    } else {
                        el.setAttribute(k, v);
                    }
                }
            }

            for (let c of this.children) {
                if (c == null) continue;
                el.appendChild(c.node());
            }

            return el;
        }
    }

    class TextVNode extends VNode {
        constructor(text) {
            super(null);
            this.text = String(text);
        }
        node() {
            this.el = document.createTextNode(this.text);
            return this.el;
        }
    }

    // Global state
    let renderFunction = null;
    let currentVTree = null;
    let rootElement = null;

    function flattenChildren(children) {
        return children
            .flat(Infinity) // fully flatten nested arrays
            .filter(child => child || child === 0) // skip falsy except 0
            .map(child => ['string', 'number'].includes(typeof child) ? new TextVNode(child) : child);
    }

    function patchChildren(parent, oldChildren, newChildren) {
        const len = Math.max(oldChildren.length, newChildren.length);

        for (let i = 0; i < len; i++) {
            const oldC = oldChildren[i];
            const newC = newChildren[i];

            if (!oldC && newC) {
                parent.appendChild(newC.node());
                continue;
            }

            if (oldC && !newC) {
                parent.removeChild(oldC.el);
                continue;
            }

            if (oldC instanceof TextVNode && newC instanceof TextVNode) {
                if (oldC.text !== newC.text) {
                    oldC.el.nodeValue = newC.text;
                }
                newC.el = oldC.el;
                continue;
            }

            if (oldC instanceof VNode && newC instanceof VNode) {
                patch(oldC, newC, parent);
            }
        }
    }

    function patch(oldVNode, newVNode, parent) {
        if (oldVNode.tag !== newVNode.tag) {
            parent.replaceChild(newVNode.node(), oldVNode.el);
            return;
        }

        const el = (newVNode.el = oldVNode.el);

        // Remove old props
        for (let k in oldVNode.props) {
            if (!(k in newVNode.props)) {
                if (k.startsWith("on")) {
                    const eventName = k.slice(2).toLowerCase();
                    el.removeEventListener(eventName, oldVNode.props[k]);
                } else if (k === "className") {
                    el.removeAttribute("class");
                } else if (k === "style") {
                    el.removeAttribute("style");
                } else {
                    el.removeAttribute(k);
                }
            }
        }

        // Update props
        for (let [k, v] of Object.entries(newVNode.props)) {
            if (k.startsWith("on") && typeof v === "function") {
                if (oldVNode.props[k] !== v) {
                    const eventName = k.slice(2).toLowerCase();
                    if (oldVNode.props[k]) {
                        el.removeEventListener(eventName, oldVNode.props[k]);
                    }
                    el.addEventListener(eventName, v);
                }
                continue;
            }

            if (k === "className") {
                if (oldVNode.props[k] !== v) {
                    el.setAttribute("class", v);
                }
                continue;
            }

            if (k === "style" && typeof v === "object") {
                if (JSON.stringify(oldVNode.props[k]) !== JSON.stringify(v)) {
                    Object.assign(el.style, v);
                }
                continue;
            }

            if (v === true) {
                el.setAttribute(k, "");
            } else if (v === false || v == null) {
                el.removeAttribute(k);
            } else if (oldVNode.props[k] !== v) {
                if (k in el && k !== 'list' && k !== 'form') {
                    el[k] = v;
                } else {
                    el.setAttribute(k, v);
                }
            }
        }

        patchChildren(el, oldVNode.children, newVNode.children);
    }

    // Render function
    function render(vnodeOrFunction, container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) {
            throw new Error('Container not found');
        }

        rootElement = container;

        if (typeof vnodeOrFunction === 'function') {
            renderFunction = vnodeOrFunction;
        } else {
            renderFunction = () => vnodeOrFunction;
        }

        const vnode = renderFunction();

        if (!currentVTree) {
            container.innerHTML = '';
            container.appendChild(vnode.node());
        } else {
            patch(currentVTree, vnode, container);
        }

        currentVTree = vnode;
    }

    // Notify function to trigger re-render
    function notify() {
        if (renderFunction && rootElement) {
            const newVTree = renderFunction();
            patch(currentVTree, newVTree, rootElement);
            currentVTree = newVTree;
        }
    }

    // Helper to wrap event handlers with auto-notify
    function wrapEventHandler(handler, shouldNotify = true) {
        return function (...args) {
            const result = handler.apply(this, args);
            if (shouldNotify !== false) {
                notify();
            }
            return result;
        };
    }

    const attrsProxy = new Proxy({}, {
        get(target, prop) {
            return (...values) => {
                if (values.length === 0) return { [prop]: true };
                if (values.length === 1) {
                    if (Array.isArray(values[0]) && values[0].raw) {
                        return { [prop]: values[0][0] };
                    }
                    return { [prop]: values[0] };
                }
                return { [prop]: values.join(' ') };
            };
        }
    });

    // Events creators
    const eventsProxy = new Proxy({}, {
        get(target, prop) {
            if (!prop.startsWith('on')) return undefined;

            return (handler, autoNotify) => {
                const shouldNotify = autoNotify !== false;
                return { [prop]: wrapEventHandler(handler, shouldNotify) };
            };
        }
    });

    // CSS creators
    const cssProxy = new Proxy({}, {
        get(target, prop) {
            return (strings, ...values) => {
                if (Array.isArray(strings) && strings.raw) {
                    return { [prop]: strings[0] };
                }
                return { [prop]: strings };
            };
        }
    });

    // Style function to combine multiple CSS properties
    function style(...cssProps) {
        const combined = {};
        cssProps.forEach(prop => {
            Object.assign(combined, prop);
        });
        return { style: combined };
    }

    // Merge props intelligently
    function mergeProps(target, source) {
        for (const key in source) {
            if (key === 'className' && target.className) {
                target.className = target.className + ' ' + source.className;
            } else if (key === 'style' && typeof target.style === 'object' && typeof source.style === 'object') {
                target.style = { ...target.style, ...source.style };
            } else {
                target[key] = source[key];
            }
        }
    }

    // Tags creator using Proxy
    const tagsProxy = new Proxy({}, {
        get(target, tag) {
            return (...args) => {
                const props = {};
                const children = [];

                args.forEach(arg => {
                    if (arg === null || arg === undefined) return;

                    if (typeof arg === 'object' && !Array.isArray(arg) && !(arg instanceof VNode) && !(arg instanceof TextVNode)) {
                        mergeProps(props, arg);
                    } else {
                        children.push(arg);
                    }
                });

                return new VNode(tag, props, children);
            };
        }
    });

    window.erg0 = {
        VNode,
        TextVNode,
        tags: tagsProxy,
        attrs: attrsProxy,
        events: eventsProxy,
        css: cssProxy,
        style: style,
        render: render,
        notify: notify
    };
})();