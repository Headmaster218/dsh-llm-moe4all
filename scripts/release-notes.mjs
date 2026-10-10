import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gte } from 'semver'

export function releaseNotes(version, tag, changelog) {
  assert.ok(tag === `release-${version}` || tag === `v${version}`, 'tag must match package version')
  const sections = changelog.replace(/\r\n/gu, '\n').split(/^## /mu)
  const section = sections.find(value => value.split('\n', 1)[0].trim() === version)
  assert.ok(section?.includes('\n- '), `missing changelog for ${version}`)
  const base = `https://github.com/Headmaster218/dsh-llm-moe4all/releases/download/${tag}`
  const updates = gte(version, '0.2.1') ? `
## Plugin updates / 插件更新

ZIP-installed copies now check GitHub Releases automatically and offer an in-plugin update after confirmation, with progress, retry, and rollback on installation failure. Restart DSH after a successful update; settings and other plugins are retained.
ZIP 安装的插件现在会自动检查 GitHub Releases，经确认后可在插件内更新，显示进度并支持重试与失败回滚。更新完成后请重启 DSH；保留配置和其他插件。

Existing 0.2.0 installations must run this newer installer once for the same DSH home to gain self-updates. Plugin updates do not update the MoE4All Engine.
已安装 0.2.0 的用户需先用此新版安装包选择同一 DSH 目录升级一次，才能获得自更新功能。插件更新不会同时更新 MoE4All 引擎。
` : ''
  return `# MoE4All for DSH ${version}

DeepSeek Harness plugin for local MoE4All inference, engine management, and model discovery.
用于本地 MoE4All 推理、引擎管理和模型发现的 DSH 插件。

## Install / 安装

1. Download [Windows installer ZIP](${base}/dsh-llm-moe4all-windows.zip), extract it, and run \`Install-MoE4All-Plugin.cmd\`.
   下载 Windows 安装包，解压后双击上述脚本。
2. Select the intended DSH installation; exit it when prompted and restart after installation.
   明确选择目标 DSH，按提示退出，安装完成后重新启动。
3. On first unconfigured startup, MoE4All setup opens automatically. Select a model and click Run.
   首次尚未配置时会自动打开设置，选择模型后点击运行。

The installer uses the bundled prebuilt plugin and does not build from Git. For upgrades, select the same DSH home; existing settings and models are retained.
安装器使用包内预编译插件，不从 Git 现场构建。升级时选择同一 DSH 目录，保留原有配置和模型。
${updates}

## Compatibility / 兼容范围

- Tested compatibility lines: DSH 0.1.1-rc.2, 0.1.5-rc.3, and 0.2.0-rc.2.
- Automatic Engine installation and this installer: Windows x86_64. Other platforms can connect to an existing OpenAI-compatible service.
- Plugin updates and Engine updates are separate. No models, credentials, or user configuration are bundled.
- 官方市场收录另行申请；本次发布不等于已经收录，也不包含 npm 发布。

[Prebuilt plugin tarball](${base}/dsh-llm-moe4all.tgz) · [SHA-256 checksums](${base}/SHA256SUMS.txt)
[English guide](https://github.com/Headmaster218/dsh-llm-moe4all/blob/${tag}/README.md) · [中文说明](https://github.com/Headmaster218/dsh-llm-moe4all/blob/${tag}/README.zh.md)

## Changes

${section.slice(section.indexOf('\n') + 1).trim()}
`
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8')
  const [tag, output] = process.argv.slice(2)
  assert.ok(output, 'usage: node scripts/release-notes.mjs <tag> <output>')
  await writeFile(resolve(output), releaseNotes(manifest.version, tag, changelog), 'utf8')
  console.log(`Release notes generated for ${tag}`)
}
