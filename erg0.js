(function (global) {
    class VNode {
        constructor(tag, props = {}, children = []) {
            this.tag = tag;
            this.props = props;
            this.children = children.flat();
            this.el = null;
        }

        node() {
            const el = document.createElement(this.tag);
            this.el = el;

            for (let [k, v] of Object.entries(this.props)) {
                if (k.startsWith("on") && typeof v === "function") {
                    el[k.toLowerCase()] = v;
                    continue;
                }
                if (k === "className") {
                    el.setAttribute("class", v);
                    continue;
                }
                if (k === "style") {
                    if (typeof v === "object") {
                        Object.assign(el.style, v);
                    } else {
                        el.setAttribute("style", v);
                    }
                    continue;
                }
                if (v === true) {
                    el.setAttribute(k, "");
                    continue;
                }
                if (v !== false && v != null) {
                    el[k] = v;
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


        for (let k in oldVNode.props) {
            if (!(k in newVNode.props)) {
                if (k.startsWith("on")) {
                    el[k.toLowerCase()] = null;
                } else if (k === "className") {
                    el.removeAttribute("class");
                } else if (k === "style") {
                    el.removeAttribute("style");
                } else {
                    el.removeAttribute(k);
                }
            }
        }


        for (let [k, v] of Object.entries(newVNode.props)) {
            if (k.startsWith("on") && typeof v === "function") {
                if (oldVNode.props[k] !== v) {
                    el[k.toLowerCase()] = v;
                }
                continue;
            }

            if (k === "className") {
                if (oldVNode.props[k] !== v) {
                    el.setAttribute("class", v);
                }
                continue;
            }

            if (k === "style") {
                const oldStyle = oldVNode.props[k];
                if (oldStyle !== v) {
                    if (typeof v === "object") {
                        // Clear old styles if type changed or update individual properties
                        if (typeof oldStyle === "string") {
                            el.setAttribute("style", "");
                        }
                        Object.assign(el.style, v);
                    } else {
                        el.setAttribute("style", v);
                    }
                }
                continue;
            }

            if (v === true) {
                el.setAttribute(k, "");
            } else if (v === false || v == null) {
                el.removeAttribute(k);
            } else if (oldVNode.props[k] !== v) {
                el[k] = v;
            }
        }

        patchChildren(el, oldVNode.children, newVNode.children);
    }

    function render(component, parent) {
        const newVNode = component();

        if (!parent._vnode) {
            parent._vnode = newVNode;
            parent._component = component;
            parent.appendChild(newVNode.node());
            return;
        }

        patch(parent._vnode, newVNode, parent);
        parent._vnode = newVNode;
    }

    function notify(parent = document.getElementById("app")) {
        render(parent._component, parent);
    }

    function mergeProps(target, source) {
        const result = { ...target };

        for (const [key, value] of Object.entries(source)) {
            // Merge className
            if (key === "className" && target.className) {
                const existingClasses = target.className.split(/\s+/).filter(Boolean);
                const newClasses = value.split(/\s+/).filter(Boolean);
                const allClasses = [...new Set([...existingClasses, ...newClasses])];
                result.className = allClasses.join(" ");
            }
            // Merge style
            else if (key === "style" && target.style) {
                if (typeof target.style === "string" && typeof value === "string") {
                    // Parse CSS strings and merge
                    const existingStyles = target.style.split(";").filter(Boolean).map(s => s.trim());
                    const newStyles = value.split(";").filter(Boolean).map(s => s.trim());
                    const styleMap = {};

                    [...existingStyles, ...newStyles].forEach(s => {
                        const [prop, val] = s.split(":").map(x => x.trim());
                        if (prop && val) styleMap[prop] = val;
                    });

                    result.style = Object.entries(styleMap).map(([k, v]) => `${k}: ${v}`).join("; ");
                } else if (typeof target.style === "object" && typeof value === "object") {
                    // Merge style objects
                    result.style = { ...target.style, ...value };
                } else {
                    // If types don't match, newer value wins
                    result[key] = value;
                }
            }
            // Default behavior: newer value wins
            else {
                result[key] = value;
            }
        }

        return result;
    }

    const tags = new Proxy({}, {
        get(_, name) {
            return (...args) => {
                let props = {};
                let children = [];
                for (const a of args) {
                    if (a == null) continue;
                    if (
                        typeof a === "object" &&
                        !(a instanceof VNode) &&
                        !(a instanceof Node) &&
                        !Array.isArray(a)
                    ) {
                        props = mergeProps(props, a);
                        continue;
                    }
                    if (typeof a === "string" || typeof a === "number") {
                        children.push(new TextVNode(a));
                        continue;
                    }
                    children.push(a);
                }
                return new VNode(name, props, children);
            };
        }
    });

    // Create tagged template functions for CSS properties
    const cssTemplates = new Proxy({}, {
        get(_, cssProp) {
            return (strings, ...values) => {
                const cssValue = String.raw({ raw: strings }, ...values);
                return { cssProp, cssValue };
            };
        }
    });

    const props = new Proxy({}, {
        get(_, key) {
            return (...args) => {
                // Handle special case for className with multiple string arguments
                if (key === "className") {
                    // If called with multiple string arguments: className("one", "two", "three")
                    if (args.length > 0 && args.every(arg => typeof arg === "string")) {
                        const classNames = args.filter(Boolean).join(" ");
                        return { className: classNames };
                    }
                }

                // Handle special case for style with multiple CSS template results
                if (key === "style") {
                    // Check if args are CSS template results
                    if (args.length > 0 && args.every(arg => arg && typeof arg === "object" && "cssProp" in arg)) {
                        const styleProps = {};
                        for (const { cssProp, cssValue } of args) {
                            // Convert kebab-case to camelCase
                            const camelProp = cssProp.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                            styleProps[camelProp] = cssValue;
                        }
                        return { style: styleProps };
                    }
                }

                // Original tagged template literal syntax
                const [strings, ...values] = args;
                if (typeof strings === "object" && strings.raw) {
                    // Tagged template literal
                    if (strings.length === 1 && strings[0] === "" && values.length === 0) {
                        return { [key]: true };
                    }
                    const value = String.raw({ raw: strings }, ...values);
                    return { [key]: value };
                }

                // Fallback for single string argument
                if (args.length === 1 && typeof args[0] === "string") {
                    return { [key]: args[0] };
                }

                // Empty call returns true
                if (args.length === 0) {
                    return { [key]: true };
                }

                return { [key]: args };
            };
        }
    });

    const events = new Proxy({}, {
        get(_, key) {
            if (!key.startsWith("on")) throw new Error("Events must start with 'on'");
            return (fn, doNotify = true) => ({
                [key]: (e) => {
                    let r = fn(e);
                    if (doNotify) notify();
                    return r;
                }
            });
        }
    });

    global.erg0 = { VNode, TextVNode, tags, props, events, render, notify, css: cssTemplates };
})(typeof window !== "undefined" ? window : globalThis);