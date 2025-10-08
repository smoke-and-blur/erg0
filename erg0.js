// erg0 VDOM Framework - Vanilla Browser JS
(function () {
    // VNode class
    class VNode {
        constructor(tag, props = {}, children = []) {
            this.tag = tag;
            this.props = props;
            this.children = Array.isArray(children) ? children : [children];
        }
    }

    // Global state
    let renderFunction = null;
    let currentVTree = null;
    let rootElement = null;

    // Diff and patch functions
    function diffProps(oldProps, newProps, el) {
        // Remove old props
        for (const key in oldProps) {
            if (!(key in newProps)) {
                removeProp(el, key, oldProps[key]);
            }
        }

        // Update/add new props
        for (const key in newProps) {
            let isChanged;

            if (key === 'style') {
                isChanged = JSON.stringify(oldProps[key]) !== JSON.stringify(newProps[key]);
            } else if (key === 'className') {
                // Direct string comparison - let updateProp handle the classList diff
                isChanged = oldProps[key] !== newProps[key];
            } else if (key.startsWith('on')) {
                // Don't update event handlers if they're the same function reference
                isChanged = oldProps[key] !== newProps[key];
            } else {
                isChanged = oldProps[key] !== newProps[key];
            }

            if (isChanged) {
                updateProp(el, key, newProps[key], oldProps[key]);
            }
        }
    }

    function updateProp(el, key, value, oldValue) {
        if (key === 'className') {
            // Use classList for efficient class management
            const oldClasses = oldValue ? oldValue.split(' ').filter(Boolean) : [];
            const newClasses = value ? value.split(' ').filter(Boolean) : [];

            // Create sets for efficient lookup
            const oldSet = new Set(oldClasses);
            const newSet = new Set(newClasses);

            // Remove old classes not in new
            oldClasses.forEach(cls => {
                if (!newSet.has(cls)) {
                    el.classList.remove(cls);
                }
            });

            // Add new classes not in old
            newClasses.forEach(cls => {
                if (!oldSet.has(cls)) {
                    el.classList.add(cls);
                }
            });
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            if (oldValue) {
                el.removeEventListener(eventName, oldValue);
            }
            el.addEventListener(eventName, value);
        } else if (key in el && key !== 'list' && key !== 'form') {
            el[key] = value;
        } else {
            el.setAttribute(key, value);
        }
    }

    function removeProp(el, key, value) {
        if (key === 'className') {
            el.className = '';
        } else if (key === 'style') {
            el.removeAttribute('style');
        } else if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            if (value) {
                el.removeEventListener(eventName, value);
            }
        } else if (key in el) {
            el[key] = null;
        } else {
            el.removeAttribute(key);
        }
    }

    function diff(oldVNode, newVNode, parentEl, index = 0) {
        const el = parentEl.childNodes[index];

        // Node doesn't exist - create it (but 0 is a valid value!)
        if (oldVNode === null || oldVNode === undefined) {
            if (newVNode !== null && newVNode !== undefined) {
                parentEl.appendChild(createElement(newVNode));
            }
            return;
        }

        // Node removed (but 0 is a valid value!)
        if (newVNode === null || newVNode === undefined) {
            if (el) {
                parentEl.removeChild(el);
            }
            return;
        }

        // Text nodes
        if (typeof oldVNode === 'string' || typeof oldVNode === 'number' ||
            typeof newVNode === 'string' || typeof newVNode === 'number') {

            // Both are text-like
            if ((typeof oldVNode === 'string' || typeof oldVNode === 'number') &&
                (typeof newVNode === 'string' || typeof newVNode === 'number')) {
                if (oldVNode !== newVNode && el) {
                    if (el.nodeType === 3) {
                        // It's a text node, just update it
                        el.textContent = String(newVNode);
                    } else {
                        // Not a text node, replace it
                        parentEl.replaceChild(document.createTextNode(String(newVNode)), el);
                    }
                }
                return;
            }

            // One is text, one is element - replace
            if (el) {
                const newNode = (typeof newVNode === 'string' || typeof newVNode === 'number')
                    ? document.createTextNode(String(newVNode))
                    : createElement(newVNode);
                parentEl.replaceChild(newNode, el);
            } else {
                parentEl.appendChild(createElement(newVNode));
            }
            return;
        }

        // Different tags - replace
        if (oldVNode.tag !== newVNode.tag) {
            if (el) {
                parentEl.replaceChild(createElement(newVNode), el);
            } else {
                parentEl.appendChild(createElement(newVNode));
            }
            return;
        }

        // Same tag - update props and diff children
        if (el) {
            diffProps(oldVNode.props, newVNode.props, el);

            // Diff children
            const oldChildren = oldVNode.children || [];
            const newChildren = newVNode.children || [];
            const maxLen = Math.max(oldChildren.length, newChildren.length);

            for (let i = 0; i < maxLen; i++) {
                diff(oldChildren[i], newChildren[i], el, i);
            }
        }
    }

    function createElement(vnode) {
        if (typeof vnode === 'string' || typeof vnode === 'number') {
            return document.createTextNode(String(vnode));
        }

        const el = document.createElement(vnode.tag);

        // Apply props
        for (const key in vnode.props) {
            updateProp(el, key, vnode.props[key]);
        }

        // Add children
        (vnode.children || []).forEach(child => {
            el.appendChild(createElement(child));
        });

        return el;
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

        // Store the function or wrap vnode in a function
        if (typeof vnodeOrFunction === 'function') {
            renderFunction = vnodeOrFunction;
        } else {
            renderFunction = () => vnodeOrFunction;
        }

        const vnode = renderFunction();

        if (!currentVTree) {
            // Initial render
            container.innerHTML = '';
            container.appendChild(createElement(vnode));
        } else {
            // Update render
            diff(currentVTree, vnode, container, 0);
        }

        currentVTree = vnode;
    }

    // Notify function to trigger re-render
    function notify() {
        if (renderFunction && rootElement) {
            const newVTree = renderFunction();
            diff(currentVTree, newVTree, rootElement, 0);
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
                    // Handle tagged template
                    if (Array.isArray(values[0]) && values[0].raw) {
                        return { [prop]: values[0][0] };
                    }
                    return { [prop]: values[0] };
                }
                // Multiple values - join with space (for className)
                return { [prop]: values.join(' ') };
            };
        }
    });

    // Events creators
    const eventsProxy = new Proxy({}, {
        get(target, prop) {
            if (!prop.startsWith('on')) return undefined;

            return (handler, autoNotify) => {
                // Auto-notify is TRUE by default, only false if explicitly passed falsy
                const shouldNotify = autoNotify !== false;
                return { [prop]: wrapEventHandler(handler, shouldNotify) };
            };
        }
    });

    // CSS creators
    const cssProxy = new Proxy({}, {
        get(target, prop) {
            return (strings, ...values) => {
                // Handle tagged template
                if (Array.isArray(strings) && strings.raw) {
                    return { [prop]: strings[0] };
                }
                // Handle direct call
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

    // Helper to flatten arrays recursively - ONLY filter null, undefined, false, empty string
    // Keep everything else including 0
    function flattenChildren(children) {
        const result = [];

        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            // Explicitly skip ONLY these falsy values
            if (child === null || child === undefined || child === false || child === '') {
                continue;
            }

            if (Array.isArray(child)) {
                // Recursively flatten
                result.push(...flattenChildren(child));
            } else {
                // Keep everything else (including 0, strings, numbers, VNodes)
                result.push(child);
            }
        }

        return result;
    }

    // Merge props intelligently
    function mergeProps(target, source) {
        for (const key in source) {
            if (key === 'className' && target.className) {
                // Merge classNames with space
                target.className = target.className + ' ' + source.className;
            } else if (key === 'style' && typeof target.style === 'object' && typeof source.style === 'object') {
                // Merge style objects
                target.style = { ...target.style, ...source.style };
            } else {
                // Regular assignment (later values override)
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

                    if (typeof arg === 'object' && !Array.isArray(arg) && !(arg instanceof VNode)) {
                        // It's a props object - merge instead of assign
                        mergeProps(props, arg);
                    } else {
                        // It's a child (could be array)
                        children.push(arg);
                    }
                });

                return new VNode(tag, props, flattenChildren(children));
            };
        }
    });

    // Main erg0 object - expose to global window
    // No modules, no exports - browser only
    window.erg0 = {
        tags: tagsProxy,
        attrs: attrsProxy,
        events: eventsProxy,
        css: cssProxy,
        style: style,
        render: render,
        notify: notify
    };
})();