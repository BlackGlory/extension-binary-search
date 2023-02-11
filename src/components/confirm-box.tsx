import { isntUndefined } from '@blackglory/prelude'

export interface IConfirmBoxProps {
  title?: string
  text?: string

  button1Text: string
  onButton1Click: () => void

  button2Text: string
  onButton2Click: () => void
}

export function ConfirmBox(props: IConfirmBoxProps) {
  const { title, text, button1Text, button2Text, onButton1Click, onButton2Click } = props

  return <>
    {isntUndefined(title) && <h1>{title}</h1>}
    {isntUndefined(text) && <div>{text}</div>}
    <button onClick={onButton1Click}>{button1Text}</button>
    <button onClick={onButton2Click}>{button2Text}</button>
  </>
}
