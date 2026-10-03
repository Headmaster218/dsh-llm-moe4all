import { useEffect, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

import type { Config } from '../index.js'

interface Props extends PropsRuntime<'settings.onboarding'> {
  scope: SettingsScope<Config>
}

export function Moe4AllOnboarding({ scope, complete, openSection }: Props): ReactNode {
  const snapshot = useSyncExternalStore(
    listener => scope.subscribe(listener),
    () => scope.getSnapshot(),
    () => scope.getSnapshot(),
  )
  const config = snapshot.value
  const needsSetup = config !== undefined
    && config.mode !== 'connect'
    && ((config.executable ?? '').trim() === '' || (config.arguments?.length ?? 0) === 0)

  useEffect(() => {
    if (config === undefined) return
    if (needsSetup) openSection('moe4all')
    complete()
  }, [complete, config, needsSetup, openSection])

  return null
}
