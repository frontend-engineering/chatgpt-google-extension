import Cashier from '@cashier/web'
import { Button, Tabs } from '@geist-ui/core'
import LogIn from '@geist-ui/icons/logIn'
import LogOut from '@geist-ui/icons/logOut'
import Settings from '@geist-ui/icons/settings'
import { GearIcon } from '@primer/octicons-react'
import { useCallback, useEffect, useState } from 'react'
import Browser from 'webextension-polyfill'
import '../base.css'
import { ProviderType } from '../config'
import logo from '../logo.png'

const isChrome = /chrome/i.test(navigator.userAgent)

function App() {
  const [tab, setTab] = useState<ProviderType>(ProviderType.Proxy)
  const [sdk, setSdk] = useState<Cashier | null>(null)
  const [username, setUsername] = useState('')
  const [amount, setAmount] = useState(0)
  const [token, setToken] = useState<string | undefined>(undefined)
  const [tokenExp, setTokenExp] = useState<number>(new Date().valueOf() - 1000)

  const initSdk = async () => {
    const cashier = new Cashier({
      appId: 'CHQZ',
      appToken: 'vNZeNQbFnL5EJx72Y37VQkem',
      storageType: 'chrome',
    })
    await cashier.init().catch((err) => {
      console.error('Cashier init failed: ', err)
    })
    return cashier
  }

  const setupSDK = () => {
    initSdk().then((inst) => {
      setSdk(inst)
    })
  }

  const userLogin = (e: any) => {
    e.preventDefault()
    console.log('user login ', e)
    sdk
      ?.login({})
      .then((info) => {
        setUsername(info?.name || '')
        setAmount(info?.profile?.amount || 0)
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
    setAmount(0)
    setToken(undefined)
    setTokenExp(0)
    sdk?.logout()
  }

  const gotoAccount = (e: any) => {
    e.preventDefault()
    window.open('https://reader.webinfra.cloud/zhi-plus/account')
  }

  const purchase = (e: any) => {
    e.preventDefault()
    sdk?.getProducts().then((list) => {
      console.log('products list: ', list)
      sdk?.purchase({})
    })
  }

  const openOptionsPage = useCallback(() => {
    Browser.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
  }, [])

  const openShortcutsPage = useCallback(() => {
    Browser.storage.local.set({ hideShortcutsTip: true })
    Browser.tabs.create({ url: 'chrome://extensions/shortcuts' })
  }, [])

  useEffect(() => {
    if (sdk) {
      sdk.getUserInfo().then((info) => {
        console.log('get user info: ', info)
        setUsername(info?.name || '')
        setAmount(info?.profile?.amount || 0)
      })
    }
  }, [sdk])

  useEffect(() => {
    setupSDK()
  }, [])

  const renderAmountButton = (amount: number) => {
    return amount > 0 ? (
      <Button type="success" ghost auto scale={0.5} icon={<Settings />} onClick={gotoAccount}>
        额度 {amount}
      </Button>
    ) : (
      <Button type="success" ghost auto scale={0.5} icon={<Settings />} onClick={purchase}>
        购买额度
      </Button>
    )
  }

  const renderLogButton = (name: string) => {
    return name ? (
      <Button type="success" ghost auto scale={0.5} icon={<LogOut />} onClick={userLogout}>
        退出
      </Button>
    ) : (
      <Button type="success" ghost auto scale={0.5} icon={<LogIn />} onClick={userLogin}>
        登录
      </Button>
    )
  }
  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 flex flex-row items-center px-1">
        <img src={logo} className="w-5 h-5 rounded-sm" />
        <p className="text-sm font-semibold m-0 ml-1">zhihu + ChatGPT</p>
        <div className="grow"></div>
        <span className="cursor-pointer leading-[0]" onClick={openOptionsPage}>
          <GearIcon size={16} />
        </span>
      </div>
      {isChrome && !hideShortcutsTipQuery.isLoading && !hideShortcutsTipQuery.data && (
        <p className="m-0 mb-2">
          Tip:{' '}
          <a onClick={openShortcutsPage} className="underline cursor-pointer">
            setup shortcuts
          </a>{' '}
          for faster access.
        </p>
      )}
      {(() => {
        return (
          <div className="grow flex flex-col">
            <Tabs value={tab} onChange={(v) => setTab(v as ProviderType)}>
              <Tabs.Item label="ChatGPT webapp" value={ProviderType.Proxy}>
                {/* <span style={{ display: 'block', fontSize: 'small', margin: '20px 0' }}>
                  {username ? '已登录：' + username : '未登录'}
                </span>
                <Spacer h={0.5} />
                <Grid.Container gap={1.5} style={{ color: 'gray', fontSize: 'small' }}>
                  { username ? <Grid xs={12}>{renderAmountButton(amount)}</Grid> : null }
                  <Grid xs={12}>{renderLogButton(username)}</Grid>
                </Grid.Container>
                <Divider /> */}

                <p
                  className="text-base px-2 text-center"
                  style={{
                    color: 'gray',
                    fontSize: 'small',
                    paddingLeft: 0,
                    // position: 'fixed',
                    // bottom: '20px',
                    // left: '50%',
                    // transform: 'translateX(-50%)',
                    width: '100%',
                  }}
                >
                  点击查看{' '}
                  <a
                    href="https://reader.webinfra.cloud/zhi-plus/account"
                    target="_blank"
                    rel="noreferrer"
                  >
                    账户详情
                  </a>
                </p>
              </Tabs.Item>
              <Tabs.Item label="OpenAI API" value={ProviderType.GPT3}>
                <p className="text-base px-2 text-center">
                  已有OpenAI账户，请登录OpenAI网页{' '}
                  <a href="https://chat.openai.com" target="_blank" rel="noreferrer">
                    chat.openai.com
                  </a>
                </p>
              </Tabs.Item>
            </Tabs>
          </div>
        )
      })()}
    </div>
  )
}

export default App
