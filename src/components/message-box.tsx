import { isntUndefined } from '@blackglory/prelude'

export interface IMessageBoxProps {
  title?: string
  text?: string

  buttonText: string
  onButtonClick: () => void
}

export function MessageBox(props: IMessageBoxProps) {
  const { title, text, buttonText, onButtonClick } = props

  return <>
    {isntUndefined(title) && <h1>{title}</h1>}
    {isntUndefined(text) && <div>{text}</div>}
    <button onClick={onButtonClick}>{buttonText}</button>
  </>
}
