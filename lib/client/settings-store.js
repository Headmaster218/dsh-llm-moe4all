export function settingsStoreForContext(context, namespace) {
    return context.configForms?.get(namespace)
        ?? context.settingsScope?.bind({ namespace });
}
//# sourceMappingURL=settings-store.js.map