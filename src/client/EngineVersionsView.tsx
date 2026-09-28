import { useState } from 'react'
import { ArrowDownToLine, ArrowUpRight, Check, FolderOpen, Package, RefreshCw, Trash2 } from 'lucide-react'
import type { InstalledEngine } from '../engine-release.js'
import { isInstalling, type Workspace } from './use-workspace.js'
import { samePath } from './workspace-model.js'
import { Button, Field, IconButton, type Translate } from './workspace-ui.js'

export function EngineVersionsView({
  workspace: w,
  t,
  onDelete,
}: {
  workspace: Workspace
  t: Translate
  onDelete(version: InstalledEngine): void
}) {
  const [path, setPath] = useState('')
  const e = w.editor!
  const installing = isInstalling(w.release) || w.working === 'install'
  return (
    <div className="m4a-engine-view">
      <div className="m4a-section-heading">
        <h3>{t('enginesTab')}</h3>
        <Button
          icon={RefreshCw}
          busy={w.working === 'updates'}
          disabled={installing}
          onClick={() => void w.checkUpdates()}
        >
          {t('checkUpdates')}
        </Button>
      </div>
      {(w.release?.versions.length ?? 0) > 0 && (
        <Field label={t('selectedEngine')}>
          <select
            value={e.config.executable ?? ''}
            onChange={(event) => {
              const version = w.release?.versions.find((item) => item.executable === event.target.value)
              if (version) w.selectEngine(version)
            }}
          >
            {!w.release?.versions.some((item) => item.executable === e.config.executable) && (
              <option value={e.config.executable ?? ''}>{e.config.executable || t('noEngine')}</option>
            )}
            {w.release?.versions.map((version) => (
              <option key={version.executable} value={version.executable}>
                {version.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <section className="m4a-engine-install">
        <div className="m4a-engine-symbol">
          <Package size={26} />
        </div>
        <div>
          <h4>{w.release?.latest?.name ?? 'MoE4All Engine'}</h4>
          <p>{w.release?.updateAvailable ? t('newVersion') : t('installEngineTitle')}</p>
        </div>
        <Button
          icon={ArrowDownToLine}
          kind="primary"
          busy={installing}
          disabled={w.release?.supported === false}
          onClick={() => void w.install()}
        >
          {t(
            w.release?.install.stage === 'error' || w.release?.install.stage === 'cancelled'
              ? 'retryDownload'
              : w.release?.updateAvailable
                ? 'updateNow'
                : 'installLatest',
          )}
        </Button>
      </section>
      <div className="m4a-section-heading">
        <h4>{t('installedVersions')}</h4>
        <span className="m4a-count">{w.release?.versions.length ?? 0}</span>
      </div>
      <div className="m4a-version-list">
        {(w.release?.versions ?? []).map((version) => {
          const selected = samePath(version.executable, e.config.executable ?? '')
          const configured = samePath(version.executable, w.baseline?.config.executable ?? '')
          return (
            <div className={`m4a-version-row ${selected ? 'is-selected' : ''}`} key={version.executable}>
              <Package size={20} />
              <div>
                <strong>{version.name}</strong>
                <code title={version.executable}>{version.executable}</code>
              </div>
              <Button
                icon={selected ? Check : undefined}
                kind="ghost"
                disabled={selected || w.disabled}
                onClick={() => w.selectEngine(version)}
              >
                {t(selected ? 'usingModel' : 'useEngine')}
              </Button>
              <IconButton
                icon={Trash2}
                label={t(configured ? 'selectedVersionHint' : 'deleteEngine')}
                disabled={configured || selected || w.status?.owned || w.status?.ready || installing}
                onClick={() => onDelete(version)}
              />
            </div>
          )
        })}
      </div>
      <section className="m4a-section">
        <h4>{t('localEngineTitle')}</h4>
        <div className="m4a-import-engine">
          <Field label={t('localEnginePath')}>
            <input
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder="D:\MoE4All\infr.exe"
            />
          </Field>
          <Button
            icon={FolderOpen}
            busy={w.working === 'install'}
            disabled={!path.trim() || installing}
            onClick={() => void w.install(path)}
          >
            {t('adoptEngine')}
          </Button>
        </div>
        <a
          className="m4a-source-link"
          href="https://github.com/Headmaster218/MoE4All/releases"
          target="_blank"
          rel="noreferrer"
        >
          GitHub Releases <ArrowUpRight size={14} />
        </a>
      </section>
    </div>
  )
}
