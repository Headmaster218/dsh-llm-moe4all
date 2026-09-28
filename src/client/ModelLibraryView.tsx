import { useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  FolderOpen,
  Image,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  Database,
} from 'lucide-react'
import type { Workspace } from './use-workspace.js'
import { modelLibrary, formatBytes, samePath, type LibraryItem } from './workspace-model.js'
import { Button, Field, IconButton, type Translate } from './workspace-ui.js'

export const roleIcon = { main: Layers3, vision: Image, mtp: Zap, embedding: Database }
export const roleLabel = {
  main: 'modelRoleMain',
  vision: 'modelRoleVision',
  mtp: 'modelRoleMtp',
  embedding: 'modelRoleEmbedding',
} as const

export function ModelLibraryView({
  workspace: w,
  t,
  compact = false,
  onImport,
  onSelected,
}: {
  workspace: Workspace
  t: Translate
  compact?: boolean
  onImport(): void
  onSelected?(): void
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const items = useMemo(() => modelLibrary(w.library.models, w.catalog), [w.library.models, w.catalog])
  const visible = items.filter(
    (item) =>
      (filter !== 'local' || item.local) &&
      (filter !== 'recommended' || item.recommended) &&
      `${item.name} ${item.family} ${item.quantization}`.toLowerCase().includes(query.toLowerCase()),
  )
  const families = [...new Set(visible.map((item) => item.family))]
  function isSelected(item: LibraryItem) {
    const setup = w.editor?.setup
    if (!setup || !item.local) return false
    const selected =
      item.kind === 'main'
        ? setup.model
        : item.kind === 'vision'
          ? setup.visionModel
          : item.kind === 'mtp'
            ? setup.mtpModel
            : setup.embeddingModel
    return samePath(selected, item.local.path)
  }
  return (
    <section className={`m4a-library ${compact ? 'm4a-library--compact' : ''}`}>
      <div className="m4a-section-heading">
        <h3>
          {t('modelsTab')}{' '}
          <span className="m4a-count">{w.library.models.filter((item) => item.complete).length}</span>
        </h3>
        <div className="m4a-inline">
          <IconButton
            icon={RefreshCw}
            label={t('rescanModels')}
            disabled={w.scanning}
            onClick={() => void w.scan()}
          />
          <Button icon={Plus} onClick={onImport}>
            {t('importModel')}
          </Button>
        </div>
      </div>
      {!compact && (
        <div className="m4a-library-storage">
          <Field label={t('modelDirectoryLabel')}>
            <input
              value={w.directory}
              onChange={(event) => w.config({ modelDirectory: event.target.value })}
              onBlur={() => void w.scan()}
            />
          </Field>
          <IconButton icon={FolderOpen} label={t('chooseDirectory')} onClick={() => void w.pickDirectory()} />
        </div>
      )}
      <div className="m4a-search">
        <Search size={16} />
        <input
          aria-label={t('searchModels')}
          placeholder={t('searchModels')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="m4a-filters" role="group" aria-label={t('modelsTab')}>
        {(['all', 'local', 'recommended'] as const).map((value) => (
          <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {t(value === 'all' ? 'filterAll' : value === 'local' ? 'filterLocal' : 'filterRecommended')}
          </button>
        ))}
      </div>
      <div className="m4a-library-results" aria-busy={w.scanning}>
        {families.length === 0 && (
          <div className="m4a-empty">
            <Layers3 size={30} />
            <strong>{t(query ? 'noMatches' : 'noLocalModels')}</strong>
            <Button icon={Plus} onClick={onImport}>
              {t('importModel')}
            </Button>
          </div>
        )}
        {families.map((family) => (
          <section className="m4a-family" key={family}>
            <h4>{family}</h4>
            {visible
              .filter((item) => item.family === family)
              .map((item) => {
                const Icon = roleIcon[item.kind]
                const selected = isSelected(item)
                const active =
                  w.download.modelId === item.recommended?.id && w.download.stage === 'downloading'
                const retry =
                  w.download.modelId === item.recommended?.id &&
                  ['cancelled', 'error'].includes(w.download.stage)
                return (
                  <article className={`m4a-model-row ${selected ? 'is-selected' : ''}`} key={item.id}>
                    <div className={`m4a-model-symbol m4a-model-symbol--${item.kind}`}>
                      <Icon size={19} />
                    </div>
                    <div className="m4a-model-info">
                      <div className="m4a-model-badges">
                        <span>{t(roleLabel[item.kind])}</span>
                        {item.recommended && (
                          <span className="m4a-badge m4a-badge--recommend">
                            <Sparkles size={10} />
                            {t('filterRecommended')}
                          </span>
                        )}
                        {item.local && (
                          <span
                            className={`m4a-badge ${item.local.complete ? 'm4a-badge--local' : 'm4a-badge--warning'}`}
                          >
                            {t(item.local.complete ? 'availableLocal' : 'incompleteModel')}
                          </span>
                        )}
                      </div>
                      <strong title={item.local?.path}>{item.name}</strong>
                      <div className="m4a-model-meta">
                        <span>{item.quantization}</span>
                        <span>{formatBytes(item.size)}</span>
                        {item.files > 1 && (
                          <span>
                            {item.local ? `${item.local.fileCount}/` : ''}
                            {item.files} GGUF
                          </span>
                        )}
                      </div>
                      <div className="m4a-model-actions">
                        {item.local?.complete ? (
                          <Button
                            icon={selected ? Check : undefined}
                            kind={selected ? 'ghost' : 'default'}
                            disabled={selected || w.disabled}
                            onClick={() => {
                              w.selectModel(item.local!.path, item.kind)
                              onSelected?.()
                            }}
                          >
                            {t(selected ? 'usingModel' : 'useSelected')}
                          </Button>
                        ) : (
                          item.recommended && (
                            <Button
                              icon={ArrowDownToLine}
                              busy={active}
                              disabled={w.download.stage === 'downloading' || w.disabled}
                              onClick={() => void w.downloadModel(item.recommended!)}
                            >
                              {t(retry ? 'continueDownload' : 'downloadAction')}
                            </Button>
                          )
                        )}
                        {item.recommended && (
                          <a
                            className="m4a-icon-btn"
                            href={item.recommended.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={t('openModelSource')}
                            aria-label={t('openModelSource')}
                          >
                            <ArrowUpRight size={15} />
                          </a>
                        )}
                      </div>
                      {active && (
                        <div className="m4a-model-download" role="status">
                          <progress value={w.download.percent ?? 0} max={100} />
                          <span>
                            {w.download.fileIndex && w.download.fileCount
                              ? `${w.download.fileIndex}/${w.download.fileCount} · `
                              : ''}
                            {formatBytes(w.download.downloadedBytes)} / {formatBytes(w.download.totalBytes ?? item.size)}
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
          </section>
        ))}
      </div>
    </section>
  )
}
