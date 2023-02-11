import { isntUndefined } from '@blackglory/prelude'

export interface IProgressProps {
  title?: string
  text?: string
  value: number
}

export function Progress(props: IProgressProps) {
  const { value, title } = props

  return <>
    {isntUndefined(title) && <h1>{title}</h1>}
    <progress value={value} />
  </>
}
