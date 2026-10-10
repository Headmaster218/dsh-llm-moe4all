export function settingsStoreForContext(context, namespace) {
    const configForms = context.get === undefined
        ? context.configForms
        : context.get('configForms');
    const settingsScope = context.get === undefined
        ? context.settingsScope
        : context.get('settingsScope');
    return configForms?.get(namespace)
        ?? settingsScope?.bind({ namespace });
}
//# sourceMappingURL=settings-store.js.map