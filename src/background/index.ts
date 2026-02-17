import { Deferred } from 'extra-promise'
import { applyPropertyDecorators } from 'extra-proxy'
import { ImplementationOf } from 'delight-rpc'
import { createServer } from '@delight-rpc/webextension'
import { IBackgroundAPI } from '@src/contract'
import { migrate } from './migrate'
import { initStorage, getExcludedExtensions, setExcludedExtensions } from './storage'
import { waitForLaunch, LaunchReason } from 'extra-webextension'
import { searchExtension } from './search-extension'

const launched = new Deferred<void>()

const api: ImplementationOf<IBackgroundAPI> = {
  searchExtension
, getExcludedExtensions
, setExcludedExtensions
}

// 确保尽早启动服务器, 以免拒绝来自客户端的连接, 造成功能失效.
createServer<IBackgroundAPI>(
  applyPropertyDecorators(
    api
  , Object.keys(api) as Array<keyof IBackgroundAPI>
  , (fn: (...args: unknown[]) => unknown) => {
      return async function (...args: unknown[]): Promise<unknown> {
        // 等待初始化/迁移执行完毕
        await launched

        return await fn(...args)
      }
    }
  ) as ImplementationOf<IBackgroundAPI>
)

waitForLaunch().then(async details => {
  switch (details.reason) {
    case LaunchReason.Install: {
      await initStorage()
      break
    }
    case LaunchReason.Update: {
      await migrate(details.previousVersion)
      break
    }
  }

  launched.resolve()
})
