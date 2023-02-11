import browser from 'webextension-polyfill'
import { useState } from 'react'
import { createServer } from '@utils/delight-rpc'
import { IDialogAPI } from '@src/contract'
import { Blank } from '@components/blank'
import { IMessageBoxProps, MessageBox } from '@components/message-box'
import { IConfirmBoxProps, ConfirmBox } from '@components/confirm-box'
import { IProgressProps, Progress } from '@components/progress'
import styled from 'styled-components'
import { go } from '@blackglory/prelude'
import { useMount } from 'extra-react-hooks'

const Window = styled.div`
  min-width: 400px;
  min-height: 300px;
`

enum DialogType {
  Blank
, MessageBox
, ConfirmBox
, Progress
}

type DialogState =
| { type: DialogType.Blank }
| { type: DialogType.MessageBox, props: IMessageBoxProps }
| { type: DialogType.ConfirmBox, props: IConfirmBoxProps }
| { type: DialogType.Progress, props: IProgressProps }

export function Dialog() {
  const [state, setState] = useState<DialogState>({ type: DialogType.Blank })

  useMount(() => {
    const closeServer = createServer<IDialogAPI>({
      message
    , confirm
    , progress
    })
    browser.runtime.sendMessage('ping')
    return closeServer
  })

  return (
    <Window>
      {
        go(() => {
          switch (state.type) {
            case DialogType.Blank: {
              return <Blank />
            }
            case DialogType.MessageBox: {
              return <MessageBox {...state.props} />
            }
            case DialogType.ConfirmBox: {
              return <ConfirmBox {...state.props} />
            }
            case DialogType.Progress: {
              return <Progress {...state.props} />
            }
          }
        })
      }
    </Window>
  )

  function confirm({ title, text, button1Text, button2Text }: {
    title?: string
  , text?: string
  , button1Text: string
  , button2Text: string
  }): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      setState({
        type: DialogType.ConfirmBox
      , props: {
          title
        , text
        , button1Text
        , button2Text
        , onButton1Click() {
            resolve(true)
          }
        , onButton2Click() {
            resolve(false)
          }
        }
      })
    })
  }

  async function message({ title, text, buttonText }: {
    title?: string
    text?: string
    buttonText: string
  }): Promise<null> {
    await new Promise<void>(resolve => {
      setState({
        type: DialogType.MessageBox
      , props: {
          title
        , text
        , buttonText
        , onButtonClick() {
            resolve()
          }
        }
      })
    })
    return null
  }

  function progress({ title, text, value }: {
    title?: string
    text?: string
    value: number
  }): null {
    setState({
      type: DialogType.Progress
    , props: {
        title
      , text
      , value
      }
    })
    return null
  }
}
