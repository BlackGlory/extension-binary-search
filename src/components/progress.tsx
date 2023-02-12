import { isntUndefined } from '@blackglory/prelude'

export interface IProgressProps {
  title?: string
  text?: string
  value: number
}

export function Progress(props: IProgressProps) {
  const { value, title } = props

  return (
    <div className='h-full flex flex-col justify-between space-y-4'>
      {isntUndefined(title) && <h1 className='text-lg font-semibold border-b'>{title}</h1>}
      <progress className='w-full' value={value} />
    </div>
  )
}
