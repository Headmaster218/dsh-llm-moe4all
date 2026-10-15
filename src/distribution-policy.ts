import type { Config } from './index.js'

type DistributionConfig = Pick<Config, 'bundledDistribution' | 'bootstrapEngineOnStart' | 'mode' | 'executable'>

export function allowsPluginSelfUpdate(config: DistributionConfig | undefined): boolean {
  return config !== undefined && !config.bundledDistribution
}

export function shouldBootstrapEngine(config: DistributionConfig): boolean {
  if (config.bundledDistribution && process.env.MOE4ALL_CAPABILITY_CENTER === '1') return false
  return (!config.bundledDistribution || config.bootstrapEngineOnStart === true)
    && config.mode !== 'connect' && !config.executable?.trim()
}
