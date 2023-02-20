import browser from 'webextension-polyfill'
import { createMigration } from 'extra-semver'
import { IExtension } from '@src/contract'
import { pipeAsync } from 'extra-utils'

export async function migrate(previousVersion: string): Promise<void> {
  await pipeAsync(
    previousVersion
  , createMigration('^1.0.0', '2.0.0', async () => {
      const OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS = 'exceptions'
      const NEW_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS = 'excludedExtensions'

      const storage: {
        [OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]?: IExtension[]
      } = await browser.storage.sync.get()

      if (storage[OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]) {
        await browser.storage.sync.set({
          [NEW_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]:
            storage[OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]
        })
        await browser.storage.sync.remove(OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS)
      }
    })
  , createMigration('2.0.0 || 2.0.1', '2.0.2', async () => {
      // sync => local
      {
        const storage = await browser.storage.sync.get()
        await browser.storage.local.set(storage)
        await browser.storage.sync.clear()
      }

      // Make sure storage is initialized
      {
        enum StorageItemKey {
          ExcludedExtensions = 'excludedExtensions'
        }

        interface IOldStorage {
          [StorageItemKey.ExcludedExtensions]?: IExtension[]
        }

        interface INewStorage {
          [StorageItemKey.ExcludedExtensions]: IExtension[]
        }

        const oldStorage: IOldStorage = await browser.storage.local.get(StorageItemKey.ExcludedExtensions)
        const newStorage: INewStorage = {
          [StorageItemKey.ExcludedExtensions]:
            oldStorage[StorageItemKey.ExcludedExtensions] ?? []
        }
        await browser.storage.local.set(newStorage)
      }
    })
  )
}
