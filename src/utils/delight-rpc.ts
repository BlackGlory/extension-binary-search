import browser from 'webextension-polyfill'
import * as DelightRPC from 'delight-rpc'
import { IRequest } from '@delight-rpc/protocol'
import { isntNull } from '@blackglory/prelude'

export function createServiceWorkerClient<IAPI extends object>(
  { parameterValidators, expectedVersion, channel }: {
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
  , expectedVersion?: string
  , channel?: string
  } = {}
): DelightRPC.ClientProxy<IAPI> {
  const port = browser.runtime

  const client = DelightRPC.createClient<IAPI>(
    async function send(request: IRequest<unknown>) {
      return await port.sendMessage(request)
    }
  , {
      parameterValidators
    , expectedVersion
    , channel
    }
  )

  return client
}

export function createTabClient<IAPI extends object>(
  tabId: number
, { parameterValidators, expectedVersion, channel }: {
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
  , expectedVersion?: string
  , channel?: string
  } = {}
): DelightRPC.ClientProxy<IAPI> {
  const port = browser.tabs

  const client = DelightRPC.createClient<IAPI>(
    async function send(request: IRequest<unknown>) {
      return await port.sendMessage(tabId, request)
    }
  , {
      parameterValidators
    , expectedVersion
    , channel
    }
  )

  return client
}

export function createServer<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, { parameterValidators, version, channel, ownPropsOnly }: {
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
    version?: `${number}.${number}.${number}`
    channel?: string | RegExp | typeof DelightRPC.AnyChannel
    ownPropsOnly?: boolean
  } = {}
): () => void {
  const port = browser.runtime

  port.onMessage.addListener(handler)
  return () => port.onMessage.removeListener(handler)

  async function handler(
    message: unknown
  , sender: browser.Runtime.MessageSender
  ): Promise<unknown> {
    if (sender.id === browser.runtime.id) {
      const req = message

      if (DelightRPC.isRequest(req) || DelightRPC.isBatchRequest(req)) {
        const result = await DelightRPC.createResponse(
          api
        , req
        , {
            parameterValidators
          , version
          , channel
          , ownPropsOnly
          }
        )

        if (isntNull(result)) {
          return result
        }
      }
    }
  }
}
