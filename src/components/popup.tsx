import { useState, useRef, useMemo } from 'react'
import styled from 'styled-components'
import { useMount } from 'extra-react-hooks'
import { go, toArray } from '@blackglory/prelude'
import { getAllManageableExtensions } from '@utils/extension'
import { i18n } from '@utils/i18n'
import { createServiceWorkerClient } from '@utils/delight-rpc'
import { IBackgroundAPI, IExtension } from '@src/contract'

const Window = styled.div`
  min-width: 400px;
`

const Info = styled.div`
  padding: 1em;
  border-radius: 0.5em;
  color: ghostwhite;
  background-color: cadetblue;
`

const Ol = styled.ol`
  margin-top: 0.5em;
  margin-bottom: 0.5em;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`

const CenterColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0 1em;
`

const Row = styled.div`
  display: flex;
  flex-direction: row;
`

const Select = styled.select`
  height: 100%;
  width: 100%;
  overflow-x: auto;
`

const PrimaryButton = styled.button`
  margin: 1em auto;
  width: 50%;
  line-height: 2em;
  display: block;
`

export function Popup() {
  const client = useMemo(() => createServiceWorkerClient<IBackgroundAPI>(), [])
  const includedSelect = useRef<HTMLSelectElement>(null)
  const excludedSelect = useRef<HTMLSelectElement>(null)
  const [includedExtensions, setIncludedExtensions] = useState<IExtension[]>([])
  const [excludedExtensions, setExcludedExtensions] = useState<IExtension[]>([])
  const [searching, setSearching] = useState<boolean>(false)

  useMount(() => {
    go(async () => {
      const excludeExtensions = await client.loadExcludedExtensions()
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
    <Window>
      <Info>
        {i18n('ui_info')}
        <Ol>
          <li>{i18n('ui_info_step1')}</li>
          <li>{i18n('ui_info_step2')}</li>
          <li>{i18n('ui_info_step3')}</li>
        </Ol>
      </Info>
      <PrimaryButton
        disabled={searching}
        onClick={search}
      >
        {i18n('ui_search')}
      </PrimaryButton>
      <h2>{i18n('ui_exception')}</h2>
      <Row>
        <Column>
          <label>{i18n('ui_checklist')}</label>
          <Select
            ref={includedSelect}
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
        <CenterColumn>
          <button onClick={moveExcludedToIncluded}>{'<'}</button>
          <button onClick={moveIncludedToExcluded}>{'>'}</button>
        </CenterColumn>
        <Column>
          <label>{i18n('ui_exceptions')}</label>
          <Select
            ref={excludedSelect}
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
      </Row>
    </Window>
  )

  async function moveIncludedToExcluded(): Promise<void> {
    const includedSelectedOptions = toArray(includedSelect.current!.selectedOptions)

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

    await client.saveExcludedExtensions(newExcludedExtensions)
  }

  async function moveExcludedToIncluded(): Promise<void> {
    const excludedSelectedOptions = toArray(excludedSelect.current!.selectedOptions)

    const newExcludedExtensions = excludedExtensions
      .filter(({ id }) => !excludedSelectedOptions.find(x => x.value === id))
    setExcludedExtensions(newExcludedExtensions)

    const newIncludedExtensions: IExtension[] = [
      ...includedExtensions
    , ...excludedSelectedOptions
        .map(({ label, value }) => ({ name: label, id: value }))
    ]
    setIncludedExtensions(newIncludedExtensions)

    await client.saveExcludedExtensions(newExcludedExtensions)
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
