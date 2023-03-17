import Cashier from '@cashier/web'
import {
  Button,
  Grid,
  Input,
  Select,
  Spacer,
  Spinner,
  Tabs,
  useInput,
  useToasts,
} from '@geist-ui/core'
import Settings from '@geist-ui/icons/settings'
import { FC, useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetchExtensionConfigs } from '../api'
import { getProviderConfigs, ProviderConfigs, ProviderType, saveProviderConfigs } from '../config'

interface ConfigProps {
  config: ProviderConfigs
  models: string[]
}

const initSdk = async () => {
  const cashier = new Cashier({
    appId: 'KRFY',
    appToken: 'KLn7KPny63GSTLEehGmu5PDN',
    storageType: 'chrome',
  })
  await cashier.init().catch((err) => {
    console.error('Cashier init failed: ', err)
  })
  return cashier
}

async function loadModels(): Promise<string[]> {
  const configs = await fetchExtensionConfigs()
  return configs.openai_model_names
}

const ConfigPanel: FC<ConfigProps> = ({ config, models }) => {
  const [tab, setTab] = useState<ProviderType>(config.provider)
  const { bindings: apiKeyBindings } = useInput(config.configs[ProviderType.GPT3]?.apiKey ?? '')
  const [model, setModel] = useState(config.configs[ProviderType.GPT3]?.model ?? models[0])
  const [sdk, setSdk] = useState<Cashier | null>(null)
  const [username, setUsername] = useState('')
  const [token, setToken] = useState<string | undefined>(undefined)
  const [tokenExp, setTokenExp] = useState<number>(new Date().valueOf() - 1000)
  const { setToast } = useToasts()

  const setupSDK = () => {
    initSdk().then((inst) => {
      setSdk(inst)
    })
  }
  const userLogin = (e: any) => {
    e.preventDefault()
    console.log('user login ', e)
    sdk
      ?.login()
      .then((info) => {
        setUsername(info?.name || '')
        return sdk.getTokens()
      })
      .then((tokens) => {
        console.log('tokens: ', tokens?.accessToken, tokens)
        setToken(tokens?.accessToken)
        setTokenExp(tokens?.expireAt || 0)
      })
  }

  const userLogout = (e: any) => {
    e.preventDefault()
    console.log('user logout')
    setUsername('')
    setToken(undefined)
    setTokenExp(0)
    sdk?.logout()
  }

  const save = useCallback(async () => {
    if (tab === ProviderType.GPT3) {
      if (!apiKeyBindings.value) {
        alert('Please enter your OpenAI API key')
        return
      }
      if (!model || !models.includes(model)) {
        alert('Please select a valid model')
        return
      }
    }

    console.log('saving tab: ', tab)
    console.log('proxy config ', token, username, tokenExp)
    await saveProviderConfigs(tab, {
      [ProviderType.GPT3]: {
        model,
        apiKey: apiKeyBindings.value,
      },
      [ProviderType.Proxy]: {
        token,
        tokenExp,
        username,
      },
    })
    setToast({ text: 'Changes saved', type: 'success' })
  }, [apiKeyBindings.value, username, token, tokenExp, model, models, setToast, tab])

  useEffect(() => {
    // 这里只在登录之后，做个小trick，自动保存下，其余case不管，需要用户手动保存
    if (token) {
      save()
    }
  }, [token, username])

  useEffect(() => {
    if (sdk) {
      sdk.getUserInfo().then((info) => {
        console.log('get user info: ', info)
        setUsername(info?.name || '')
      })
    }
  }, [sdk])

  useEffect(() => {
    setupSDK()
  }, [])
  return (
    <div className="flex flex-col gap-3">
      <Tabs value={tab} onChange={(v) => setTab(v as ProviderType)}>
        <Tabs.Item label="ChatGPT webapp" value={ProviderType.Proxy}>
          <span style={{ display: 'block' }}>
            代理服务, <span className="font-semibold">不需要翻墙</span>
          </span>
          <Spacer h={0.5} />
          <Grid.Container gap={1.5}>
            {/* <Grid xs={20}><Input htmlType="text" label="Host" scale={2 / 3} width="100%" {...proxyHostBindings} /></Grid> */}
            <Grid xs={20}>{username ? '已登录：' + username : '未登录'}</Grid>
            <Grid xs={4}>
              {username ? (
                <Button
                  type="success"
                  ghost
                  auto
                  scale={0.5}
                  icon={<Settings />}
                  onClick={userLogout}
                >
                  退出
                </Button>
              ) : (
                <Button
                  type="success"
                  ghost
                  auto
                  scale={0.5}
                  icon={<Settings />}
                  onClick={userLogin}
                >
                  登录
                </Button>
              )}
            </Grid>
          </Grid.Container>
        </Tabs.Item>
        <Tabs.Item label="OpenAI API" value={ProviderType.GPT3}>
          <div className="flex flex-col gap-2">
            <span>
              OpenAI official API, more stable,{' '}
              <span className="font-semibold">charge by usage</span>
            </span>
            <div className="flex flex-row gap-2">
              <Select
                scale={2 / 3}
                value={model}
                onChange={(v) => setModel(v as string)}
                placeholder="model"
              >
                {models.map((m) => (
                  <Select.Option key={m} value={m}>
                    {m}
                  </Select.Option>
                ))}
              </Select>
              <Input htmlType="password" label="API key" scale={2 / 3} {...apiKeyBindings} />
            </div>
            <span className="italic text-xs">
              You can find or create your API key{' '}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer"
              >
                here
              </a>
            </span>
          </div>
        </Tabs.Item>
      </Tabs>
      <Button scale={2 / 3} ghost style={{ width: 20 }} type="success" onClick={save}>
        Save
      </Button>
    </div>
  )
}

function ProviderSelect() {
  const query = useSWR('provider-configs', async () => {
    const [config, models] = await Promise.all([getProviderConfigs(), loadModels()])
    return { config, models }
  })
  if (query.isLoading) {
    return <Spinner />
  }
  return <ConfigPanel config={query.data!.config} models={query.data!.models} />
}

export default ProviderSelect
