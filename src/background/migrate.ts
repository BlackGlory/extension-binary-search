import browser from 'webextension-polyfill'
import { createMigration } from 'extra-semver'
import { IExtension } from '@src/contract'
import { pipeAsync } from 'extra-utils'
import { assert } from '@blackglory/prelude'

export async function migrate(
  previousVersion: string
, expectedVersion: string
): Promise<void> {
  const actualVersion = await pipeAsync(
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
