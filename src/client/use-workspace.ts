import { useEffect, useRef, useState } from 'react'
import type { Config } from '../index.js'
import type { EngineControlStatus } from '../host-routes.js'
import type { EngineReleaseStatus, InstalledEngine } from '../engine-release.js'
import type { ModelDownloadProgress, RecommendedModel } from '../model-download.js'
import type { LocalModelLibrary, ModelFileKind } from '../model-files.js'
import type { Moe4AllSettingsProps } from './Moe4AllSettings.js'
import * as api from './engine-api.js'
import { composeEditor, editorFromConfig, equal, type Editor } from './workspace-model.js'
import { normalizeSetupPath } from './engine-setup.js'
import type { Translate } from './workspace-ui.js'

export const isInstalling = (release: EngineReleaseStatus | null): boolean =>
  !!release &&
  ['checking', 'downloading', 'verifying', 'extracting', 'finalizing'].includes(release.install.stage)
export function useWorkspace(props: Moe4AllSettingsProps) {
  const snapshot = props.useMoe4AllSettings((value) => value)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [baseline, setBaseline] = useState<Editor | null>(null)
  const [status, setStatus] = useState<EngineControlStatus | null>(null)
  const [release, setRelease] = useState<EngineReleaseStatus | null>(null)
  const [catalog, setCatalog] = useState<RecommendedModel[]>([])
  const [library, setLibrary] = useState<LocalModelLibrary>({ directory: '', models: [] })
  const [download, setDownload] = useState<ModelDownloadProgress>({ stage: 'idle', downloadedBytes: 0 })
  const [defaultDirectory, setDefaultDirectory] = useState('')
  const [nativePicker, setNativePicker] = useState(false)
  const [working, setWorking] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [resourcePrompt, setResourcePrompt] = useState(false)
  const saving = useRef(false)
  const mounted = useRef(true)
  const live = useRef(editor)
  live.current = editor
  const dirty = editor !== null && baseline !== null && !equal(editor, baseline)
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  const directory = editor?.config.modelDirectory || defaultDirectory
  const previousDownload = useRef('idle')
  const scanGeneration = useRef(0)

  useEffect(() => {
    if (!snapshot.value || saving.current) return
    const next = editorFromConfig(snapshot.value)
    setBaseline(next)
    if (!dirtyRef.current) setEditor(next)
  }, [snapshot.revision, snapshot.value])

  function report(cause: unknown) {
    if (!mounted.current) return
    const text = cause instanceof Error ? cause.message : String(cause)
    const keys = [
      'invalidTokens',
      'missingModelError',
      'missingEngineError',
      'importError',
      'selectDestination',
      'invalidExtra',
    ]
    setError(keys.includes(text) ? props.t(text as Parameters<Translate>[0]) : text)
  }
  async function run(label: string, task: () => Promise<void>) {
    setWorking(label)
    setError('')
    setNotice('')
    try {
      await task()
      return true
    } catch (cause) {
      report(cause)
      return false
    } finally {
      if (mounted.current) setWorking('')
    }
  }
  async function scan(path = live.current?.config.modelDirectory || defaultDirectory, selected?: string[]) {
    const generation = ++scanGeneration.current
    setScanning(true)
    const setup = live.current?.setup
    try {
      const result = await api.scanModelLibrary(
        path,
        selected ??
          (setup
            ? [setup.model, setup.visionModel, setup.mtpModel, setup.embeddingModel].filter(Boolean)
            : []),
      )
      if (mounted.current && generation === scanGeneration.current) setLibrary(result)
      return result
    } finally {
      if (mounted.current && generation === scanGeneration.current) setScanning(false)
    }
  }
  useEffect(() => {
    mounted.current = true
    let timer: ReturnType<typeof setTimeout>
    let disposed = false
    const poll = async () => {
      const results = await Promise.allSettled([
        api.fetchEngineStatus(),
        api.fetchReleaseStatus(),
        api.fetchModelDownload(),
      ])
      if (disposed) return
      const [runtime, engines, model] = results
      if (runtime.status === 'fulfilled') {
        setStatus(runtime.value)
        setError((previous) => (previous === props.t('controlUnavailable') ? '' : previous))
      } else {
        setStatus(null)
        setError((previous) => previous || props.t('controlUnavailable'))
      }
      if (engines.status === 'fulfilled') setRelease(engines.value)
      if (model.status === 'fulfilled') {
        setDownload(model.value)
        if (model.value.stage === 'complete' && previousDownload.current !== 'complete') {
          const setup = live.current?.setup
          void scan(model.value.directory, [
            setup?.model ?? '',
            setup?.visionModel ?? '',
            setup?.mtpModel ?? '',
            setup?.embeddingModel ?? '',
            model.value.selectedFile ?? '',
          ]).catch(report)
        }
        previousDownload.current = model.value.stage
      }
      timer = setTimeout(() => {
        void poll()
      }, 1200)
    }
    void poll()
    void api
      .fetchModelCatalog()
      .then((result) => {
        if (disposed) return
        setCatalog(result.models)
        setNativePicker(result.capabilities.nativeFilePicker)
        setDefaultDirectory(result.defaultDirectory)
      })
      .catch(report)
    return () => {
      mounted.current = false
      disposed = true
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editor !== null && directory) void scan(directory).catch(report)
    }, 350)
    return () => clearTimeout(timer)
  }, [directory, editor === null])

  const edit = (update: (previous: Editor) => Editor) =>
    setEditor((previous) => (previous === null ? previous : update(previous)))
  const config = (patch: Partial<Config>) =>
    edit((previous) => ({ ...previous, config: { ...previous.config, ...patch } }))
  const setup = (patch: Partial<Editor['setup']>) =>
    edit((previous) => ({ ...previous, setup: { ...previous.setup, ...patch } }))

  async function persist(requireModel = false): Promise<Config> {
    const value = live.current!
    if (requireModel && !value.config.executable) throw new Error('missingEngineError')
    const next = composeEditor(value)
    if (value.config.mode !== 'connect')
      await api.validateModelPaths({
        main: value.setup.model,
        ...(value.setup.visionModel ? { vision: value.setup.visionModel } : {}),
        ...(value.setup.embeddingModel ? { embedding: value.setup.embeddingModel } : {}),
        ...(value.setup.mtp ? { mtp: value.setup.mtpModel } : {}),
      })
    saving.current = true
    try {
      await props.save(next)
      const saved = editorFromConfig(next)
      setBaseline(saved)
      setEditor(saved)
      live.current = saved
      setNotice(status?.owned ? props.t('savedNextStart') : props.t('saved'))
    } finally {
      saving.current = false
    }
    return next
  }

  const save = () =>
    run('save', async () => {
      await persist()
    })
  const launch = (force = false, restart = false) =>
    run('start', async () => {
      await persist(live.current?.config.mode !== 'connect')
      if (restart) await api.stopEngine()
      const result = await api.startEngine(force)
      setStatus(result.status)
      setResourcePrompt(result.status.phase === 'resource-warning')
      if (result.ok) setNotice(props.t('connectionOk'))
    })
  const stop = () =>
    run('stop', async () => {
      const result = await api.stopEngine()
      setStatus(result.status)
    })
  const refresh = () =>
    run('refresh', async () => {
      const next = await api.fetchEngineStatus()
      setStatus(next)
      setNotice(props.t(next.ready ? 'connectionOk' : 'connectionFailed'))
    })

  function selectEngine(engine: InstalledEngine) {
    config({ executable: engine.executable, workingDirectory: engine.workingDirectory })
    setNotice(props.t('engineSelectedNotice'))
  }
  async function install(localPath?: string) {
    await run('install', async () => {
      if (localPath) await api.installLocalEngine(localPath)
      else await api.installLatestEngine()
      while (mounted.current) {
        const next = await api.fetchReleaseStatus()
        setRelease(next)
        if (!isInstalling(next)) {
          if (next.install.stage === 'complete' && next.installed) selectEngine(next.installed)
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 600))
      }
    })
  }
  const checkUpdates = () =>
    run('updates', async () => {
      const next = await api.fetchReleaseStatus(true)
      setRelease(next)
      if (next.message) throw new Error(next.message)
      setNotice(props.t(next.updateAvailable ? 'newVersion' : 'upToDate'))
    })
  const removeVersion = (engine: InstalledEngine) =>
    run('delete', async () => {
      await api.deleteEngineVersion(engine.tag)
      setRelease(await api.fetchReleaseStatus())
    })
  const stopInstall = () =>
    run('cancel-install', async () => {
      await api.cancelEngineInstall()
      setRelease(await api.fetchReleaseStatus())
    })

  function selectModel(path: string, kind: ModelFileKind) {
    edit((previous) => {
      const next = { ...previous.setup }
      if (kind === 'main') {
        const model = library.models.find((item) => item.path === path)
        const previousModel = library.models.find((item) => item.path === next.model)
        if (path !== next.model && (!model || !previousModel || model.family !== previousModel.family)) {
          next.visionModel = ''
          next.mtpModel = ''
          next.mtp = false
        }
        next.model = path
        if (model) {
          const related = library.models.filter((item) => item.family === model.family && item.complete)
          if (!next.visionModel) next.visionModel = related.find((item) => item.kind === 'vision')?.path ?? ''
          if (!next.mtpModel) next.mtpModel = related.find((item) => item.kind === 'mtp')?.path ?? ''
        }
      } else if (kind === 'vision') next.visionModel = path
      else if (kind === 'embedding') next.embeddingModel = path
      else {
        next.mtpModel = path
        next.mtp = !!path
      }
      return { ...previous, setup: next }
    })
    setNotice(props.t('modelSelectedNotice'))
  }
  const importPath = (path: string, kind: ModelFileKind = 'main') =>
    run('import', async () => {
      const files = await api.scanModelPath(normalizeSetupPath(path))
      const selected =
        files.selected && files[kind].includes(files.selected) ? files.selected : files[kind][0]
      if (!selected) throw new Error('importError')
      const result = await scan(directory, [
        ...(live.current
          ? [
              live.current.setup.model,
              live.current.setup.visionModel,
              live.current.setup.mtpModel,
              live.current.setup.embeddingModel,
            ]
          : []),
        selected,
      ])
      const model = result.models.find((item) => item.path === selected)
      if (model && !model.complete) throw new Error(props.t('incompleteModel'))
      selectModel(selected, kind)
      if (kind === 'main')
        setup({
          model: selected,
          visionModel: files.vision[0] ?? '',
          mtpModel: files.mtp[0] ?? '',
          mtp: false,
        })
    })
  const pickFile = (kind: ModelFileKind = 'main') =>
    run('picker', async () => {
      const path = await api.pickModelFile()
      if (path) await importPath(path, kind)
    })
  const pickDirectory = () =>
    run('directory', async () => {
      const path = await props.pickDirectory()
      if (path) {
        config({ modelDirectory: path })
        await scan(path)
      }
    })
  const downloadModel = (model: RecommendedModel) =>
    run('download', async () => {
      if (!directory) throw new Error('selectDestination')
      config({ modelDirectory: directory })
      setDownload(
        await api.startModelDownload(
          model.id,
          download.modelId === model.id && download.directory ? download.directory : directory,
        ),
      )
    })
  const stopDownload = () =>
    run('cancel-download', async () => {
      setDownload(await api.cancelModelDownload())
    })
  return {
    editor,
    baseline,
    dirty,
    edit,
    config,
    setup,
    status,
    release,
    catalog,
    library,
    download,
    directory,
    nativePicker,
    working,
    scanning,
    error,
    notice,
    setError,
    setNotice,
    resourcePrompt,
    setResourcePrompt,
    disabled: !snapshot.writable || ['save', 'start', 'stop', 'delete'].includes(working),
    snapshot,
    scan: () =>
      run('scan', async () => {
        await scan()
      }),
    save,
    launch,
    stop,
    refresh,
    selectEngine,
    install,
    checkUpdates,
    removeVersion,
    stopInstall,
    selectModel,
    importPath,
    pickFile,
    pickDirectory,
    downloadModel,
    stopDownload,
    revert: () => {
      if (baseline) setEditor(baseline)
      setError('')
      setNotice('')
    },
  }
}
export type Workspace = ReturnType<typeof useWorkspace>
