import { isntUndefined } from '@blackglory/prelude'
import { Button } from '@components/button'

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
    {isntUndefined(title) && <h1 className='text-lg font-semibold border-b'>{title}</h1>}
    {isntUndefined(text) && <div>{text}</div>}
    <div className='flex flex-row space-x-2'>
      <div className='flex-1'>
        <Button onClick={onButton1Click}>
          {button1Text}
        </Button>
      </div>
      <div className='flex-1'>
        <Button onClick={onButton2Click}>
          {button2Text}
        </Button>
      </div>
    </div>
  </>
}
