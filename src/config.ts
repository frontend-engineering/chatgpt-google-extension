import { defaults } from 'lodash-es'
import Browser from 'webextension-polyfill'

export enum TriggerMode {
  Always = 'always',
  // QuestionMark = 'questionMark',
  Manually = 'manually',
}

export const TRIGGER_MODE_TEXT = {
  [TriggerMode.Always]: { title: '自动', desc: '每次搜索自动请求ChatGPT' },
  // [TriggerMode.QuestionMark]: {
  //   title: '问号❓触发',
  //   desc: '仅当在问题结尾输入问号时 (?)触发',
  // },
  [TriggerMode.Manually]: {
    title: '手动触发',
    desc: '仅当手动点击触发按钮时',
  },
}

export enum Theme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

export enum Language {
  Auto = 'auto',
  English = 'english',
  Chinese = 'chinese',
  Spanish = 'spanish',
  French = 'french',
  Korean = 'korean',
  Japanese = 'japanese',
  German = 'german',
  Portuguese = 'portuguese',
}

const userConfigWithDefaultValue = {
  triggerMode: TriggerMode.Always,
  theme: Theme.Auto,
  language: Language.Chinese,
}

export type UserConfig = typeof userConfigWithDefaultValue

export async function getUserConfig(): Promise<UserConfig> {
  const result = await Browser.storage.local.get(Object.keys(userConfigWithDefaultValue))
  return defaults(result, userConfigWithDefaultValue)
}

export async function updateUserConfig(updates: Partial<UserConfig>) {
  console.debug('update configs', updates)
  return Browser.storage.local.set(updates)
}

export enum ProviderType {
  Proxy = 'proxy',
  GPT3 = 'gpt3',
}

interface GPT3ProviderConfig {
  model: string
  apiKey: string
}
interface ProxyProviderConfig {
  model: string
  apiKey: string
}

export interface ProviderConfigs {
  provider: ProviderType
  configs: {
    [ProviderType.GPT3]?: GPT3ProviderConfig | undefined
    [ProviderType.Proxy]?: ProxyProviderConfig | undefined
  }
}

export async function getProviderConfigs(): Promise<ProviderConfigs> {
  const { provider = ProviderType.Proxy } = await Browser.storage.local.get('provider')
  const gpt3Config = await Browser.storage.local.get(`provider:${ProviderType.GPT3}`)
  const proxyConfig = await Browser.storage.local.get(`provider:${ProviderType.Proxy}`)
  return {
    provider,
    configs: {
      [ProviderType.GPT3]: gpt3Config[`provider:${ProviderType.GPT3}`],
      [ProviderType.Proxy]: proxyConfig[`provider:${ProviderType.Proxy}`],
    },
  }
}

export async function saveProviderConfigs(
  provider: ProviderType,
  configs: ProviderConfigs['configs'],
) {
  return Browser.storage.local.set({
    provider,
    [`provider:${ProviderType.GPT3}`]: configs[ProviderType.GPT3],
    [`provider:${ProviderType.Proxy}`]: configs[ProviderType.Proxy],
  })
}
