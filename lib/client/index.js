import { createElement, Fragment } from 'react';
import { EngineStartupOverlay } from './EngineStartupOverlay.js';
import { Moe4AllOnboarding } from './Moe4AllOnboarding.js';
import { Moe4AllSettings } from './Moe4AllSettings.js';
import { PluginUpdateNotice } from './PluginUpdateNotice.js';
import { RuntimeStatusDock } from './RuntimeStatus.js';
import { en, zh } from './locales.js';
import { styles } from './styles.js';
export const inject = ['slots', 'locale', 'settingsScope', 'workspaces'];
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
        pickDirectory: () => ctx.workspaces.pickDirectory(),
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
    ctx.slots.inject('settings.onboarding', () => ctx.slots.register({
        name: 'settings.onboarding',
        id: 'moe4all-setup-v2',
        order: -50,
    }, owner => createElement(Moe4AllOnboarding, { ...owner, scope })));
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'moe4all-overlays',
        label: () => 'MoE4All',
    }, () => createElement(Fragment, null, createElement(EngineStartupOverlay, {
        scope,
        t: ctx.locale.bind('settings.moe4all'),
    }), createElement(PluginUpdateNotice, {
        t: ctx.locale.bind('settings.moe4all'),
    }))));
    ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
        name: 'conversation.composer.dock',
        id: 'moe4all-runtime',
        order: -20,
        label: () => 'MoE4All',
    }, () => createElement(RuntimeStatusDock, {
        scope,
        t: ctx.locale.bind('settings.moe4all'),
    })));
}
const plugin = { inject, apply };
export default plugin;
//# sourceMappingURL=index.js.map