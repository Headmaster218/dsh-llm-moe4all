import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { ChevronDown, CircleHelp, LoaderCircle, X } from 'lucide-react';
export function Button({ icon: Icon, children, kind = 'default', busy, ...props }) {
    return (_jsxs("button", { type: "button", ...props, className: `m4a-btn m4a-btn--${kind} ${props.className ?? ''}`, disabled: props.disabled || busy, children: [busy ? (_jsx(LoaderCircle, { size: 16, className: "m4a-spin" })) : Icon ? (_jsx(Icon, { size: 16, "aria-hidden": "true" })) : null, children] }));
}
export function IconButton({ icon: Icon, label, ...props }) {
    return (_jsx("button", { type: "button", ...props, className: `m4a-icon-btn ${props.className ?? ''}`, "aria-label": label, title: label, children: _jsx(Icon, { size: 16, "aria-hidden": "true" }) }));
}
export function Field({ label, help, children, className = '', }) {
    return (_jsxs("label", { className: `m4a-field ${className}`, children: [_jsxs("span", { className: "m4a-field-label", children: [label, help && (_jsxs("span", { tabIndex: 0, className: "m4a-help", "aria-label": help, children: [_jsx(CircleHelp, { size: 13 }), _jsx("span", { role: "tooltip", children: help })] }))] }), children] }));
}
export function Toggle({ label, checked, onChange, disabled, detail, }) {
    return (_jsxs("label", { className: "m4a-toggle-row", children: [_jsxs("span", { children: [_jsx("span", { className: "m4a-toggle-label", children: label }), detail && _jsx("small", { children: detail })] }), _jsx("input", { type: "checkbox", role: "switch", checked: checked, disabled: disabled, onChange: (event) => onChange(event.target.checked) }), _jsx("span", { className: "m4a-switch", "aria-hidden": "true" })] }));
}
export function Disclosure({ title, children, icon: Icon, open = false, }) {
    return (_jsxs("details", { className: "m4a-disclosure", open: open || undefined, children: [_jsxs("summary", { children: [Icon && _jsx(Icon, { size: 16 }), _jsx("span", { children: title }), _jsx(ChevronDown, { size: 15 })] }), _jsx("div", { className: "m4a-disclosure-body", children: children })] }));
}
export function Dialog({ title, children, onClose, actions, closeLabel, }) {
    const ref = useRef(null);
    const close = useRef(onClose);
    close.current = onClose;
    useEffect(() => {
        const element = ref.current;
        element?.showModal();
        const escape = (event) => {
            if (event.key !== 'Escape' || !element?.open)
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            close.current();
        };
        window.addEventListener('keydown', escape, true);
        return () => {
            window.removeEventListener('keydown', escape, true);
            element?.close();
        };
    }, []);
    return (_jsx("dialog", { ref: ref, className: "m4a-dialog", "aria-label": title, onKeyDown: (event) => {
            if (event.key === 'Escape')
                event.stopPropagation();
        }, onCancel: (event) => {
            event.preventDefault();
            onClose();
        }, onClick: (event) => {
            if (event.target === event.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "m4a-dialog-inner", children: [_jsxs("header", { children: [_jsx("h3", { children: title }), _jsx(IconButton, { icon: X, label: closeLabel, onClick: onClose })] }), _jsx("div", { className: "m4a-dialog-body", children: children }), actions && _jsx("footer", { children: actions })] }) }));
}
export function Transfer({ label, detail, percent, error, actions, }) {
    return (_jsxs("div", { className: `m4a-transfer${error ? ' m4a-transfer--error' : ''}`, role: "status", children: [_jsxs("div", { className: "m4a-transfer-heading", children: [_jsx("strong", { children: label }), _jsx("span", { children: percent === undefined ? '' : `${Math.min(100, Math.max(0, percent)).toFixed(1)}%` }), actions] }), _jsx("progress", { "aria-label": label, max: 100, value: percent }), detail && _jsx("small", { children: detail }), error && _jsx("p", { children: error })] }));
}
//# sourceMappingURL=workspace-ui.js.map