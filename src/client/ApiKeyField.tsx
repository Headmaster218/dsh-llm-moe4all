import { useEffect, useState } from 'react'
import { Check, Copy, Eye, EyeOff, RefreshCw, Save } from 'lucide-react'

import type { Workspace } from './use-workspace.js'
import { Button, Field, IconButton, type Translate } from './workspace-ui.js'

export function ApiKeyField({ workspace: w, t }: { workspace: Workspace; t: Translate }) {
  const [draft, setDraft] = useState('')
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => { setDraft(w.apiKey?.value ?? '') }, [w.apiKey?.value])
  const changed = draft.trim() !== (w.apiKey?.value ?? '')
  return (
    <Field
      label={t('apiKeyLabel')}
      help={t(w.apiKey?.required ? 'apiKeyRemoteHelp' : 'apiKeyLocalHelp')}
      className="m4a-span-2"
    >
      <div className="m4a-secret-field">
        <input
          type={visible ? 'text' : 'password'}
          value={draft}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
        />
        <IconButton
          icon={visible ? EyeOff : Eye}
          label={t(visible ? 'hideApiKey' : 'showApiKey')}
          onClick={() => setVisible((value) => !value)}
        />
        <IconButton
          icon={copied ? Check : Copy}
          label={t(copied ? 'copied' : 'copyApiKey')}
          disabled={!draft}
          onClick={() => {
            void navigator.clipboard.writeText(draft).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }).catch((error) => w.setError(String(error)))
          }}
        />
      </div>
      <div className="m4a-inline">
        <Button
          icon={Save}
          disabled={!changed || !draft.trim()}
          busy={w.working === 'api-key'}
          onClick={() => void w.saveApiKey(draft)}
        >
          {t('saveApiKey')}
        </Button>
        <Button
          kind="ghost"
          icon={RefreshCw}
          busy={w.working === 'api-key'}
          onClick={() => void w.regenerateApiKey()}
        >
          {t('generateApiKey')}
        </Button>
      </div>
    </Field>
  )
}
