import { Moe4AllSettings } from './Moe4AllSettings.js';
import { en, zh } from './locales.js';
import { styles } from './styles.js';
export const inject = ['slots', 'locale', 'settingsScope'];
const SETTINGS_NAMESPACE = 'moe4all-engine';
function changedFields(current, next) {
    return Object.keys(next).filter(field => (JSON.stringify(current[field]) !== JSON.stringify(next[field])));
}
export function apply(ctx) {
    const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
    ctx.effect(() => ctx.locale.register('settings.moe4all', { zh, en }), 'moe4all-engine: settings dictionaries');
    ctx.effect(() => {
        const tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-llm-moe4all';
        tag.textContent = styles;
        document.head.appendChild(tag);
        return () => { tag.remove(); };
    }, 'moe4all-engine: settings styles');
    const injected = () => ({
        hooks: { moe4AllSettings: scope },
        async save(next) {
            const current = scope.getSnapshot().value;
            if (current === undefined)
                return;
            await Promise.all(changedFields(current, next).map(field => scope.set(field, next[field])));
        },
    });
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'moe4all',
        order: 15,
        label: () => ctx.locale.bind('settings.moe4all')('nav'),
        locale: 'settings.moe4all',
        inject: injected,
    }, Moe4AllSettings));
}
const plugin = { inject, apply };
export default plugin;
//# sourceMappingURL=index.js.map