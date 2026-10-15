import type { Translate } from './workspace-ui.js'

export function startupAdjustmentSuggestions(t: Translate): string[] {
  return [
    t('startupAdjustParallel'),
    t('startupAdjustContext'),
    t('startupAdjustProfile'),
    t('startupAdjustModel'),
  ]
}
