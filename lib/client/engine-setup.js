export function buildEngineArguments(values) {
    const model = values.model.trim();
    const host = values.host.trim();
    if (model === '')
        throw new Error('A model GGUF path is required.');
    if (host === '' || /\s/u.test(host))
        throw new Error('A valid listen host is required.');
    if (!Number.isSafeInteger(values.port) || values.port < 1 || values.port > 65_535) {
        throw new Error('The listen port must be between 1 and 65535.');
    }
    if (!Number.isSafeInteger(values.contextWindow) || values.contextWindow < 1) {
        throw new Error('The context window must be a positive token count.');
    }
    if (!Number.isSafeInteger(values.parallel) || values.parallel < 1) {
        throw new Error('Concurrent slots must be a positive integer.');
    }
    const arguments_ = [
        'serve',
        '--addr', `${host}:${values.port}`,
        '--parallel', String(values.parallel),
        '--ctx', String(values.contextWindow),
    ];
    if (values.profile === 'aggressive')
        arguments_.push('--set', 'device.auto_profile=aggressive');
    if (values.mtp)
        arguments_.push('--set', 'spec.mtp=true');
    arguments_.push(model);
    return arguments_;
}
//# sourceMappingURL=engine-setup.js.map