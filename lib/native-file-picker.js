import { spawn } from 'node:child_process';
function pickerCommand() {
    if (process.platform === 'win32') {
        const script = [
            "Add-Type -AssemblyName System.Windows.Forms",
            "$dialog = New-Object System.Windows.Forms.OpenFileDialog",
            "$dialog.Filter = 'GGUF model (*.gguf)|*.gguf|All files (*.*)|*.*'",
            '$dialog.Multiselect = $false',
            "$dialog.Title = 'Select a MoE4All GGUF model'",
            "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::OutputEncoding = [Text.Encoding]::UTF8; $dialog.FileName }",
        ].join('; ');
        return {
            executable: 'powershell.exe',
            arguments: ['-NoLogo', '-NoProfile', '-STA', '-Command', script],
        };
    }
    if (process.platform === 'darwin') {
        return {
            executable: 'osascript',
            arguments: ['-e', 'POSIX path of (choose file with prompt "Select a MoE4All GGUF model")'],
        };
    }
    if (process.platform === 'linux') {
        return {
            executable: 'zenity',
            arguments: ['--file-selection', '--title=Select a MoE4All GGUF model', '--file-filter=GGUF model | *.gguf'],
        };
    }
    return undefined;
}
export function nativeFilePickerAvailable() {
    return pickerCommand() !== undefined;
}
export async function pickGgufFile() {
    const command = pickerCommand();
    if (command === undefined)
        throw new Error('A native model file picker is not available on this platform.');
    return new Promise((resolvePick, reject) => {
        const child = spawn(command.executable, command.arguments, {
            shell: false,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', (chunk) => { stdout += chunk; });
        child.stderr.on('data', (chunk) => { stderr += chunk; });
        child.once('error', reject);
        child.once('close', (code) => {
            const selected = stdout.trim();
            if (code === 0)
                resolvePick(selected === '' ? undefined : selected);
            else if (code === 1 && selected === '')
                resolvePick(undefined);
            else
                reject(new Error(`Native model picker failed (${String(code)}): ${stderr.trim()}`));
        });
    });
}
//# sourceMappingURL=native-file-picker.js.map