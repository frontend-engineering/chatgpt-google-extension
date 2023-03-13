import { SearchIcon } from '@primer/octicons-react'
import { useState } from 'preact/hooks'
import { TriggerMode } from '../config'
import ChatGPTQuery, { QueryStatus } from './ChatGPTQuery'

interface Props {
  question: string
  triggerMode: TriggerMode
  onStatusChange?: (status: QueryStatus) => void
}

function ChatGPTCard(props: Props) {
  const [triggered, setTriggered] = useState(false)

  if (props.triggerMode === TriggerMode.Always) {
    return <ChatGPTQuery question={props.question} onStatusChange={props.onStatusChange} />
  }
  // if (props.triggerMode === TriggerMode.QuestionMark) {
  //   if (endsWithQuestionMark(props.question.trim())) {
  //     return <ChatGPTQuery question={props.question} onStatusChange={props.onStatusChange} />
  //   }
  //   return (
  //     <p className="icon-and-text">
  //       <LightBulbIcon size="small" /> 问号（？）触发模式：当问题以问号结尾时，自动请求ChatGPT
  //     </p>
  //   )
  // }
  if (triggered) {
    return <ChatGPTQuery question={props.question} onStatusChange={props.onStatusChange} />
  }
  return (
    <p className="icon-and-text cursor-pointer" onClick={() => setTriggered(true)}>
      <SearchIcon size="small" /> 点击询问ChatGPT
    </p>
  )
}

export default ChatGPTCard
