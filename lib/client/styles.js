export const styles = `
.m4a-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: min(100%, 760px);
  color: var(--dsw-alias-label-primary);
}
.m4a-settings * { box-sizing: border-box; }
.m4a-settings__header { display: flex; flex-direction: column; gap: 6px; }
.m4a-settings__title { margin: 0; font-size: 18px; line-height: 1.4; font-weight: 650; }
.m4a-settings__subtitle { margin: 0; max-width: 680px; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 1.55; }
.m4a-settings__status { display: flex; align-items: center; gap: 8px; min-height: 24px; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
.m4a-settings__dot { width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; background: #7a828c; }
.m4a-settings__dot--ready { background: var(--dsw-alias-state-success-primary, #2f9e63); }
.m4a-settings__dot--busy { background: var(--dsw-alias-brand-primary, #3478d4); }
.m4a-settings__dot--warning { background: var(--dsw-alias-state-warning-primary, #c47b18); }
.m4a-settings__dot--error { background: var(--dsw-alias-state-danger-primary, #d54b4b); }
.m4a-settings__models, .m4a-settings__release { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 1.45; overflow-wrap: anywhere; }
.m4a-settings__error { margin: 2px 0 0; color: var(--dsw-alias-state-danger-primary, #d54b4b); font-size: 12px; line-height: 1.45; }
.m4a-settings__runtime-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.m4a-settings__endpoint { margin-left: auto; max-width: 65%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.m4a-settings__group { display: flex; flex-direction: column; gap: 14px; padding: 0 0 22px; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.m4a-settings__group:last-of-type { border-bottom: 0; }
.m4a-settings__group-title { margin: 0; font-size: 13px; line-height: 1.4; font-weight: 650; }
.m4a-settings__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.m4a-settings__field { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
.m4a-settings__field--wide { grid-column: 1 / -1; }
.m4a-settings__label { font-size: 12px; line-height: 1.35; color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); }
.m4a-settings__hint { margin: 0; font-size: 11px; line-height: 1.45; color: var(--dsw-alias-label-tertiary); }
.m4a-settings__input, .m4a-settings__select, .m4a-settings__textarea {
  width: 100%; min-width: 0; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 13px; outline: none;
}
.m4a-settings__input, .m4a-settings__select { height: 36px; padding: 0 10px; }
.m4a-settings__textarea { min-height: 78px; resize: vertical; padding: 9px 10px; line-height: 1.45; }
.m4a-settings__input:focus, .m4a-settings__select:focus, .m4a-settings__textarea:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent); }
.m4a-settings__input--invalid { border-color: var(--dsw-alias-state-danger-primary, #d54b4b); }
.m4a-settings__input:disabled, .m4a-settings__select:disabled, .m4a-settings__textarea:disabled { opacity: .55; cursor: not-allowed; }
.m4a-settings__segmented { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3px; padding: 3px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-2); }
.m4a-settings__segment { min-height: 32px; border: 0; border-radius: 5px; background: transparent; color: var(--dsw-alias-label-tertiary); font: inherit; font-size: 12px; cursor: pointer; }
.m4a-settings__segment[aria-pressed='true'] { background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); box-shadow: 0 0 0 1px var(--dsw-alias-border-l2); font-weight: 600; }
.m4a-settings__segment:focus-visible, .m4a-settings__button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.m4a-settings__check { display: flex; align-items: flex-start; gap: 9px; font-size: 12px; line-height: 1.45; color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); }
.m4a-settings__check input { width: 16px; height: 16px; margin: 1px 0 0; accent-color: var(--dsw-alias-brand-primary); }
.m4a-settings__percentage { display: grid; grid-template-columns: minmax(0, 1fr) 52px; align-items: center; gap: 10px; }
.m4a-settings__percentage input[type='range'] { width: 100%; accent-color: var(--dsw-alias-brand-primary); }
.m4a-settings__percentage output { text-align: right; font-size: 12px; font-variant-numeric: tabular-nums; }
.m4a-settings__details summary { cursor: pointer; font-size: 13px; font-weight: 650; list-style-position: outside; }
.m4a-settings__details[open] summary { margin-bottom: 14px; }
.m4a-settings__actions { position: sticky; bottom: 0; display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 0; background: var(--dsw-alias-bg-layer-1, transparent); }
.m4a-settings__save-state { margin-right: auto; color: var(--dsw-alias-label-tertiary); font-size: 11px; }
.m4a-settings__button { min-height: 34px; padding: 0 14px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; cursor: pointer; }
.m4a-settings__button--primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: white; }
.m4a-settings__button--danger { border-color: var(--dsw-alias-state-danger-primary, #c83f49); background: var(--dsw-alias-state-danger-primary, #c83f49); color: white; }
.m4a-settings__button:disabled { opacity: .5; cursor: default; }
.m4a-settings__message { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; }
.m4a-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 24px; pointer-events: auto; background: rgb(0 0 0 / .48); }
.m4a-overlay__dialog { width: min(100%, 520px); max-height: min(720px, calc(100vh - 48px)); overflow: auto; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; padding: 22px; background: var(--dsw-alias-bg-layer-1, #fff); color: var(--dsw-alias-label-primary); box-shadow: 0 18px 55px rgb(0 0 0 / .28); }
.m4a-overlay__title { margin: 0 0 10px; font-size: 18px; line-height: 1.4; }
.m4a-overlay__body, .m4a-overlay__version, .m4a-overlay__endpoint, .m4a-overlay__error { margin: 0 0 12px; font-size: 13px; line-height: 1.55; }
.m4a-overlay__version { color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); }
.m4a-overlay__endpoint { display: block; overflow-wrap: anywhere; color: var(--dsw-alias-label-tertiary); }
.m4a-overlay__error { color: var(--dsw-alias-state-danger-primary, #d54b4b); }
.m4a-overlay__reasons { margin: 0 0 16px; padding-left: 20px; color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); font-size: 12px; line-height: 1.55; }
.m4a-overlay__progress { display: grid; gap: 7px; margin: 0 0 14px; color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); font-size: 12px; font-variant-numeric: tabular-nums; }
.m4a-overlay__progress progress { width: 100%; height: 8px; accent-color: var(--dsw-alias-brand-primary); }
.m4a-overlay__links { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 0 0 16px; font-size: 12px; }
.m4a-overlay__links a { color: var(--dsw-alias-brand-primary); text-underline-offset: 2px; }
.m4a-overlay__local-path { margin-top: 4px; }
.m4a-overlay__setup-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.m4a-overlay__mtp { margin-top: 14px; }
.m4a-overlay__actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.m4a-overlay__actions--three { justify-content: stretch; }
.m4a-overlay__actions--three .m4a-settings__button { flex: 1 1 130px; }
.m4a-overlay__actions--install .m4a-settings__button { flex: 1 1 125px; }
@media (max-width: 680px) {
  .m4a-settings__grid { grid-template-columns: minmax(0, 1fr); }
  .m4a-settings__field--wide { grid-column: auto; }
  .m4a-settings__endpoint { display: none; }
  .m4a-overlay { padding: 12px; }
  .m4a-overlay__dialog { padding: 18px; }
  .m4a-overlay__setup-grid { grid-template-columns: minmax(0, 1fr); }
}
`;
//# sourceMappingURL=styles.js.map