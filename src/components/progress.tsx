import { isntUndefined } from '@blackglory/prelude'
import { Text } from '@components/text'

export interface IProgressProps {
  title?: string
  text?: string

  value: number
}

export function Progress(props: IProgressProps) {
  const { title, text, value } = props

  return <>
    {
      isntUndefined(title) && (
        <h1 className='text-lg font-semibold border-b'>{title}</h1>
      )
    }
    {
      isntUndefined(text) && (
        <div>
          <Text>{text}</Text>
        </div>
      )
    }
    <progress className='w-full' value={value} />
  </>
}
