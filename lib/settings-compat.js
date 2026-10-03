const NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*$/u;
export function settingsNamespace(value) {
    if (!NAMESPACE_PATTERN.test(value)) {
        throw new TypeError(`settings namespace "${value}" must match ${String(NAMESPACE_PATTERN)}`);
    }
    return value;
}
//# sourceMappingURL=settings-compat.js.map