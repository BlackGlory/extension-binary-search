import * as React from 'react'
import produce from 'immer'
import styled from 'styled-components'
import { promisify, getAllControllableExtensions, writeExceptionsConfig, readExceptionsConfig, ExtensionInfoLite } from '../utils'

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

interface OptionsState {
  extensions: ExtensionInfoLite[]
  exceptions: ExtensionInfoLite[]
  switcher: {
    searching: boolean
  }
}

export default class Options extends React.Component<{}, OptionsState> {
  state: OptionsState = {
    extensions: []
  , exceptions: []
  , switcher: {
      searching: false
    }
  }

  selectChecklist: HTMLSelectElement|null = null
  selectExceptions: HTMLSelectElement|null = null

  async componentDidMount() {
    const exceptions = await readExceptionsConfig()
    const controllableExtensions = (await getAllControllableExtensions()).map(x => ({
      id: x.id
    , name: x.name
    })) as ExtensionInfoLite[]

    this.setState(produce((draft: OptionsState) => {
      draft.exceptions = exceptions.filter(({ id }) => {
        return controllableExtensions.find(x => x.id === id)
      })
      draft.extensions = controllableExtensions.filter(({ id }) => {
        return !exceptions.find(x => x.id === id)
      })
    }))
  }

  moveToException = () => {
    const checklistSelectedOptions = Array.from(this.selectChecklist!.selectedOptions)
    this.setState(produce((draft: OptionsState) => {
      draft.extensions = draft.extensions.filter(({ id }) => {
        return !checklistSelectedOptions.find(x => x.value === id)
      })
      for (let { label, value } of checklistSelectedOptions) {
        draft.exceptions.push({ name: label, id: value })
      }
    }), () => writeExceptionsConfig(this.state.exceptions))
  }

  moveToChecklist = () => {
    const exceptionsSelectedOptions = Array.from(this.selectExceptions!.selectedOptions)
    this.setState(produce((draft: OptionsState) => {
      draft.exceptions = draft.exceptions.filter(({ id }) => {
        return !exceptionsSelectedOptions.find(x => x.value === id)
      })
      for (let { label, value } of exceptionsSelectedOptions) {
        draft.extensions.push({ name: label, id: value })
      }
    }), () => writeExceptionsConfig(this.state.exceptions))
  }

  search = () => {
    this.setState(produce((draft: OptionsState) => {
      draft.switcher.searching = true
    }), async () => {
      if (await promisify(chrome.runtime.sendMessage)('search')) {
        this.setState(produce((draft: OptionsState) => {
          draft.switcher.searching = false
        }))
      }
    })
  }

  render() {
    const { extensions, exceptions, switcher } = this.state
    return (
      <div>
        <Info>
          { chrome.i18n.getMessage('ui_info') }
          <Ol>
            <li>{ chrome.i18n.getMessage('ui_info_step1') }</li>
            <li>{ chrome.i18n.getMessage('ui_info_step2') }</li>
            <li>{ chrome.i18n.getMessage('ui_info_step3') }</li>
          </Ol>
        </Info>
        <PrimaryButton disabled={ switcher.searching } onClick={ this.search }>{ chrome.i18n.getMessage('ui_search') }</PrimaryButton>
        <h2>{ chrome.i18n.getMessage('ui_exception') }</h2>
        <Row>
          <Column>
            <label>{ chrome.i18n.getMessage('ui_checklist') }</label>
            <Select innerRef={ (x: any) => this.selectChecklist = x } size={ 10 } multiple onDoubleClick={ this.moveToException }>
              { extensions.map(x => <option key={ x.id } value={ x.id }>{ x.name }</option>) }
            </Select>
          </Column>
          <CenterColumn>
            <button onClick={ this.moveToChecklist }>&lt;</button>
            <button onClick={ this.moveToException }>&gt;</button>
          </CenterColumn>
          <Column>
            <label>{ chrome.i18n.getMessage('ui_exceptions') }</label>
            <Select innerRef={ (x: any) => this.selectExceptions = x } size={ 10 } multiple onDoubleClick={ this.moveToChecklist }>
              { exceptions.map(x => <option key={ x.id } value={ x.id }>{ x.name }</option>) }
            </Select>
          </Column>
        </Row>
      </div>
    )
  }
}
