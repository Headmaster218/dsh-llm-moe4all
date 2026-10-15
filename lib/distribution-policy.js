export function allowsPluginSelfUpdate(config) {
    return config !== undefined && !config.bundledDistribution;
}
export function shouldBootstrapEngine(config) {
    return (!config.bundledDistribution || config.bootstrapEngineOnStart === true)
        && config.mode !== 'connect' && !config.executable?.trim();
}
//# sourceMappingURL=distribution-policy.js.map