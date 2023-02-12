import browser from 'webextension-polyfill'
import semver from 'semver'
import { IExtension } from '@src/contract'
import { pipe } from 'extra-utils'
import { assert, Awaitable } from '@blackglory/prelude'

export async function migrate(previousVersion: string, expectedVersion: string): Promise<void> {
  const actualVersion = await pipe(
    previousVersion
  , createMigration('^1.0.0', '2.0.0', async () => {
      const OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS = 'exceptions'
      const NEW_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS = 'excludedExtensions'

      const storage: {
        [OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]?: IExtension[]
      } = await browser.storage.sync.get(null)

      if (storage[OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]) {
        await browser.storage.sync.set({
          [NEW_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]:
            storage[OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]
        })
        await browser.storage.sync.remove(OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS)
      }
    })
  )

  assert(actualVersion === expectedVersion, 'Migration failed')
}

function createMigration(
  semverCondition: string
, resultVersion: string
, fn: () => Awaitable<void>
): (currentVersion: string) => Promise<string> {
  return async (currentVersion: string): Promise<string> => {
    if (semver.satisfies(currentVersion, semverCondition)) {
      await fn()
      return resultVersion
    } else {
      return currentVersion
    }
  }
}
