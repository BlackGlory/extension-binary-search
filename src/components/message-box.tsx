import { isntUndefined } from '@blackglory/prelude'
import { Button } from '@components/button'

export interface IMessageBoxProps {
  title?: string
  text?: string

  buttonText: string
  onButtonClick: () => void
}

export function MessageBox(props: IMessageBoxProps) {
  const { title, text, buttonText, onButtonClick } = props

  return (
    <div className='h-full flex flex-col justify-between space-y-4'>
      {isntUndefined(title) && <h1 className='text-lg font-semibold border-b'>{title}</h1>}
      {isntUndefined(text) && <div>{text}</div>}
      <div className='flex'>
        <Button onClick={onButtonClick}>
          {buttonText}
        </Button>
      </div>
    </div>
  )
}
