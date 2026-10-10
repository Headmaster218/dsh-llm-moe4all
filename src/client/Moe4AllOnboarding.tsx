import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

import type { Config } from '../index.js'
import { StandaloneMoe4AllSettings, type Moe4AllSettingsProps } from './Moe4AllSettings.js'
import type { SettingsStore } from './settings-store.js'
import { IconButton } from './workspace-ui.js'

export function needsFirstRunSetup(config: Config | undefined): boolean {
  return config !== undefined
    && config.mode !== 'connect'
    && ((config.executable ?? '').trim() === '' || (config.arguments?.length ?? 0) === 0)
}

export function FirstRunSettingsOverlay({
  scope,
  t,
  pickDirectory,
  save,
}: {
  scope: SettingsStore<Config>
  t: Moe4AllSettingsProps['t']
  pickDirectory(): Promise<string | null>
  save(next: Config): Promise<void>
}): ReactNode {
  const snapshot = useSyncExternalStore(
    listener => scope.subscribe(listener),
    () => scope.getSnapshot(),
    () => scope.getSnapshot(),
  )
  const dialog = useRef<HTMLDialogElement>(null)
  const [dismissed, setDismissed] = useState(false)
  const needsSetup = needsFirstRunSetup(snapshot.value)

  useEffect(() => {
    const element = dialog.current
    if (!element || dismissed || !needsSetup) return
    element.showModal()
    return () => element.close()
  }, [dismissed, needsSetup])

  if (!needsSetup || dismissed) return null
  return (
    <dialog
      ref={dialog}
      className="m4a-first-run-dialog"
      aria-label="MoE4All"
      onCancel={(event) => {
        event.preventDefault()
        setDismissed(true)
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) setDismissed(true)
      }}
    >
      <div className="m4a-first-run-frame">
        <div className="m4a-first-run-close">
          <IconButton icon={X} label={t('notNow')} onClick={() => setDismissed(true)} />
        </div>
        <StandaloneMoe4AllSettings
          scope={scope}
          t={t}
          pickDirectory={pickDirectory}
          save={save}
          close={() => setDismissed(true)}
        />
      </div>
    </dialog>
  )
}
