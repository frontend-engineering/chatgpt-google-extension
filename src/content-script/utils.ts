import Browser from 'webextension-polyfill'

export function getPossibleElementByQuerySelector<T extends Element>(
  queryArray: string[],
): T | undefined {
  for (const query of queryArray) {
    const element = document.querySelector(query)
    if (element) {
      return element as T
    }
  }
}

export function getAllContentsByQuerySelector(queryArray: string[]): string | undefined {
  const queryList = []
  for (const query of queryArray) {
    const element = document.querySelector(query)
    if (element) {
      queryList.push((element as any).innerText || element.innerHTML || (element as any).value)
    }
  }
  return queryList.join('\n')
}

export function changeToEditable(queryArray: string[]) {
  for (const query of queryArray) {
    const elements = document.querySelectorAll(query)
    ;[...elements].forEach((element) => {
      if (element) {
        console.log('find element: ', element)
        const contents = (element as any).innerText || element.innerHTML || (element as any).value
        const newNode = document.createElement('textarea')
        newNode.value = contents
        newNode.className = 'editable ' + element.className
        element.parentElement?.replaceChild(newNode, element)
      }
    })
  }
}

export function shutdownEditable() {
  const list = document.querySelectorAll('.editable')
  ;[...list].forEach((element) => {
    ;(element as any).disabled = true
  })
}

export function endsWithQuestionMark(question: string) {
  return (
    question.endsWith('?') || // ASCII
    question.endsWith('？') || // Chinese/Japanese
    question.endsWith('؟') || // Arabic
    question.endsWith('⸮') // Arabic
  )
}

export function isBraveBrowser() {
  return (navigator as any).brave?.isBrave()
}

export async function shouldShowRatingTip() {
  const { ratingTipShowTimes = 0 } = await Browser.storage.local.get('ratingTipShowTimes')
  if (ratingTipShowTimes >= 5) {
    return false
  }
  await Browser.storage.local.set({ ratingTipShowTimes: ratingTipShowTimes + 1 })
  return ratingTipShowTimes >= 2
}
