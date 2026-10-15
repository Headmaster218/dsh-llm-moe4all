export function allowsPluginSelfUpdate(config) {
    return config !== undefined && !config.bundledDistribution;
}
export function shouldBootstrapEngine(config) {
    if (config.bundledDistribution && process.env.MOE4ALL_CAPABILITY_CENTER === '1')
        return false;
    return (!config.bundledDistribution || config.bootstrapEngineOnStart === true)
        && config.mode !== 'connect' && !config.executable?.trim();
}
//# sourceMappingURL=distribution-policy.js.map