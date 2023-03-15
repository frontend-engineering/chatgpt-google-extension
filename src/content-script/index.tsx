import { render } from 'preact'
import '../base.css'
import { getUserConfig, Language, Theme } from '../config'
import { detectSystemColorScheme } from '../utils'
import ChatGPTContainer from './ChatGPTContainer'
import EditBtn from './EditBtn'
import { config, SearchEngine } from './search-engine-configs'
import './styles.scss'
import {
  changeToEditable,
  getAllContentsByQuerySelector,
  getPossibleElementByQuerySelector,
  shutdownEditable,
} from './utils'

async function mount(question: string, siteConfig: SearchEngine) {
  const container = document.createElement('div')
  container.className = 'chat-gpt-container'

  console.log('container ', container)
  const userConfig = await getUserConfig()
  let theme: Theme
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }
  if (theme === Theme.Dark) {
    container.classList.add('gpt-dark')
  } else {
    container.classList.add('gpt-light')
  }

  const siderbarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
  console.log('0000sidbar ', siderbarContainer)
  if (siderbarContainer) {
    siderbarContainer.prepend(container)
  } else {
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
    if (appendContainer) {
      appendContainer.appendChild(container)
    }
  }

  render(
    <ChatGPTContainer question={question} triggerMode={userConfig.triggerMode || 'always'} />,
    container,
  )
}

function unmount() {
  const container = document.querySelector('.chat-gpt-container')
  if (container) {
    console.log('container found: ', container)
    container.parentElement?.removeChild(container)
  }
  console.log()
}

const siteRegex = new RegExp(Object.keys(config).join('|'))
const siteName = location.hostname.match(siteRegex)![0]
const siteConfig = config[siteName]
console.log('site siteConfig: ', siteConfig)

async function run() {
  unmount()
  const searchInput = getAllContentsByQuerySelector(siteConfig.inputQuery)
  console.log('site searchInput: ', searchInput)
  const prefix =
    '请用专业的语气回答下面问题，详细描述细节和原因，最好给出实例论证每一个观点，并将答案扩展到400字以上: \n'
  if (searchInput) {
    console.debug('Mount ChatGPT on', siteName)
    const userConfig = await getUserConfig()
    const searchValueWithLanguageOption =
      prefix +
      (userConfig.language === Language.Auto
        ? searchInput
        : `${searchInput}(in ${userConfig.language})`)

    await mount(searchValueWithLanguageOption, siteConfig)
  }
}

const mountEdit = () => {
  // QuestionHeader-side
  ;(document.querySelector('.QuestionRichText-more') as any).click()
  // QuestionHeaderActions
  const qestionContainer = document.querySelector('.QuestionHeader-footer-inner')!
  const newBtnContainer = document.createElement('div')
  qestionContainer.appendChild(newBtnContainer)

  const onEdit = (editing: boolean) => {
    if (editing) {
      console.log('shutdone edit mode')
      shutdownEditable()
      run()
      return
    }
    console.log('chagne to edit mode')
    changeToEditable(siteConfig.inputQuery)
  }
  render(<EditBtn onEdit={onEdit} />, newBtnContainer)
}

run()
mountEdit()

if (siteConfig.watchRouteChange) {
  siteConfig.watchRouteChange(run)
}
