import { spawn } from 'node:child_process'

interface PickerCommand {
  executable: string
  arguments: string[]
}

interface DesktopPickerResponse {
  path?: unknown
}

type PickerKind = 'model' | 'engine'

function desktopBridge(): URL | undefined {
  const value = process.env.MOE4ALL_DESKTOP_BRIDGE?.trim()
  const token = process.env.MOE4ALL_DESKTOP_TOKEN?.trim()
  if (!value || !token) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') return undefined
    return url
  } catch {
    return undefined
  }
}

async function pickFromDesktopBridge(kind: PickerKind): Promise<string | undefined> {
  const bridge = desktopBridge()
  if (bridge === undefined) return undefined
  const response = await fetch(new URL(kind === 'engine' ? '/pick-engine' : '/pick-model', bridge), {
    method: 'POST',
    headers: { 'X-MoE4All-Token': process.env.MOE4ALL_DESKTOP_TOKEN! },
  })
  if (!response.ok) throw new Error(`MoE4All desktop file picker failed (${String(response.status)}).`)
  const body = await response.json() as DesktopPickerResponse
  if (body.path === null || body.path === undefined || body.path === '') return undefined
  if (typeof body.path !== 'string') throw new Error('MoE4All desktop file picker returned an invalid path.')
  return body.path
}

function pickerCommand(kind: PickerKind): PickerCommand | undefined {
  const engine = kind === 'engine'
  if (process.platform === 'win32') {
    const script = [
      "Add-Type -AssemblyName System.Windows.Forms",
      "$dialog = New-Object System.Windows.Forms.OpenFileDialog",
      `$dialog.Filter = '${engine ? 'MoE4All engine (*.zip;infr.exe)|*.zip;infr.exe' : 'GGUF model (*.gguf)|*.gguf'}|All files (*.*)|*.*'`,
      '$dialog.Multiselect = $false',
      `$dialog.Title = '${engine ? 'Select a MoE4All engine package or infr.exe' : 'Select a MoE4All GGUF model'}'`,
      "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::OutputEncoding = [Text.Encoding]::UTF8; $dialog.FileName }",
    ].join('; ')
    return {
      executable: 'powershell.exe',
      arguments: ['-NoLogo', '-NoProfile', '-STA', '-Command', script],
    }
  }
  if (process.platform === 'darwin') {
    return {
      executable: 'osascript',
      arguments: ['-e', `POSIX path of (choose file with prompt "Select a MoE4All ${engine ? 'engine package or executable' : 'GGUF model'}")`],
    }
  }
  if (process.platform === 'linux') {
    return {
      executable: 'zenity',
      arguments: ['--file-selection', `--title=Select a MoE4All ${engine ? 'engine package or executable' : 'GGUF model'}`,
        engine ? '--file-filter=MoE4All engine | *.zip infr.exe' : '--file-filter=GGUF model | *.gguf'],
    }
  }
  return undefined
}

export function nativeFilePickerAvailable(): boolean {
  return desktopBridge() !== undefined || pickerCommand('model') !== undefined
}

async function pickFile(kind: PickerKind): Promise<string | undefined> {
  if (desktopBridge() !== undefined) return pickFromDesktopBridge(kind)
  const command = pickerCommand(kind)
  if (command === undefined) throw new Error('A native model file picker is not available on this platform.')
  return new Promise((resolvePick, reject) => {
    const child = spawn(command.executable, command.arguments, {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => { stdout += chunk })
    child.stderr.on('data', (chunk: string) => { stderr += chunk })
    child.once('error', reject)
    child.once('close', (code) => {
      const selected = stdout.trim()
      if (code === 0) resolvePick(selected === '' ? undefined : selected)
      else if (code === 1 && selected === '') resolvePick(undefined)
      else reject(new Error(`Native file picker failed (${String(code)}): ${stderr.trim()}`))
    })
  })
}

export function pickGgufFile(): Promise<string | undefined> {
  return pickFile('model')
}

export function pickEngineFile(): Promise<string | undefined> {
  return pickFile('engine')
}
