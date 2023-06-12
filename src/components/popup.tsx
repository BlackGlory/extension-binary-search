import { forwardRef, useState, useRef, useMemo } from 'react'
import { useMount } from 'extra-react-hooks'
import { go, toArray } from '@blackglory/prelude'
import { getAllManageableExtensions } from '@utils/extension'
import { i18n } from '@utils/i18n'
import { createBackgroundClient } from '@delight-rpc/webextension'
import { IBackgroundAPI, IExtension } from '@src/contract'
import { Button } from '@components/button'
import classNames from 'classnames'

export function Popup() {
  const client = useMemo(() => createBackgroundClient<IBackgroundAPI>(), [])
  const includedExtensionsSelect = useRef<HTMLSelectElement>(null)
  const excludedExtensionsSelect = useRef<HTMLSelectElement>(null)
  const [includedExtensions, setIncludedExtensions] = useState<IExtension[]>([])
  const [excludedExtensions, setExcludedExtensions] = useState<IExtension[]>([])
  const [searching, setSearching] = useState<boolean>(false)

  useMount(() => {
    go(async () => {
      const excludeExtensions = await client.getExcludedExtensions()
      const controllableExtensions = (await getAllManageableExtensions())
        .map(x => ({ id: x.id, name: x.name })) as IExtension[]

      setExcludedExtensions(
        excludeExtensions
          .filter(({ id }) => controllableExtensions.find(x => x.id === id))
      )
      setIncludedExtensions(
        controllableExtensions
          .filter(({ id }) => !excludeExtensions.find(x => x.id === id))
      )
    })
  })

  return (
    <div className='min-w-[500px] p-4 space-y-4 text-base'>
      <div>
        {i18n('ui_manual')}
        <ol className='my-2 list-decimal list-inside'>
          <li>{i18n('ui_manual_step1')}</li>
          <li>{i18n('ui_manual_step2')}</li>
          <li>{i18n('ui_manual_step3')}</li>
        </ol>
      </div>
      <hr className='my-0' />
      <div className='space-y-2'>
        <span>{i18n('ui_exclusion_description')}</span>
        <div className='flex flex-row text-sm'>
          <Column>
            <label>{i18n('ui_included_extensions')}</label>
            <Select
              ref={includedExtensionsSelect}
              size={10}
              multiple
              onDoubleClick={moveIncludedToExcluded}
            >
              {includedExtensions.map(x => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Column>
          <div className='flex flex-col justify-center m-2 space-y-2'>
            <Button onClick={moveExcludedToIncluded}>{'<'}</Button>
            <Button onClick={moveIncludedToExcluded}>{'>'}</Button>
          </div>
          <Column>
            <label>{i18n('ui_excluded_extensions')}</label>
            <Select
              ref={excludedExtensionsSelect}
              size={10}
              multiple
              onDoubleClick={moveExcludedToIncluded}
            >
              {excludedExtensions.map(x => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Column>
        </div>
      </div>
      <hr className='my-0' />
      <div className='flex my-2 justify-center'>
        <div className='w-1/2'>
          <Button
            disabled={searching}
            onClick={search}
          >
            {i18n('ui_search_button')}
          </Button>
        </div>
      </div>
    </div>
  )

  async function moveIncludedToExcluded(): Promise<void> {
    const includedSelectedOptions = toArray(includedExtensionsSelect.current!.selectedOptions)

    setIncludedExtensions(
      includedExtensions
        .filter(({ id }) => !includedSelectedOptions.find(x => x.value === id))
    )

    const newExcludedExtensions: IExtension[] = [
      ...excludedExtensions
    , ...includedSelectedOptions
        .map(({ label, value }) => ({ name: label, id: value }))
    ]
    setExcludedExtensions(newExcludedExtensions)

    await client.setExcludedExtensions(newExcludedExtensions)
  }

  async function moveExcludedToIncluded(): Promise<void> {
    const excludedSelectedOptions = toArray(excludedExtensionsSelect.current!.selectedOptions)

    const newExcludedExtensions = excludedExtensions
      .filter(({ id }) => !excludedSelectedOptions.find(x => x.value === id))
    setExcludedExtensions(newExcludedExtensions)

    const newIncludedExtensions: IExtension[] = [
      ...includedExtensions
    , ...excludedSelectedOptions
        .map(({ label, value }) => ({ name: label, id: value }))
    ]
    setIncludedExtensions(newIncludedExtensions)

    await client.setExcludedExtensions(newExcludedExtensions)
  }

  async function search(): Promise<void> {
    setSearching(true)
    try {
      await client.searchExtension()
    } finally {
      setSearching(false)
    }
  }
}

const Select = forwardRef(function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
, ref: React.ForwardedRef<HTMLSelectElement>
) {
  return (
    <select
      {...props}
      className={classNames('border h-full w-full overflow-x-auto', props.className)}
      ref={ref}
    />
  )
})

function Column(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={classNames('flex flex-col flex-1', props.className)}
    />
  )
}
