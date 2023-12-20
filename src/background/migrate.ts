import { createMigration } from 'extra-semver'
import { IExtension } from '@src/contract'
import { pipeAsync } from 'extra-utils'
import { LocalStorage } from 'extra-webextension'

export async function migrate(previousVersion: string): Promise<void> {
  await pipeAsync(
    previousVersion
  , createMigration('^1.0.0', '2.0.0', async () => {
      const OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS = 'exceptions'
      const NEW_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS = 'excludedExtensions'

      interface IOldStorage {
        [OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]?: IExtension[]
      }

      interface INewStorage {
        [NEW_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]?: IExtension[]
      }

      const oldStorage: IOldStorage = await chrome.storage.sync.get()
      if (oldStorage[OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]) {
        const newStorage: INewStorage = {
          [NEW_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]:
            oldStorage[OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]
        }
        await chrome.storage.sync.set(newStorage)
        await chrome.storage.sync.remove(OLD_STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS)
      }
    })
  , createMigration('2.0.0 || 2.0.1', '2.0.2', async () => {
      // sync => local
      {
        const storage = await chrome.storage.sync.get()
        await chrome.storage.local.set(storage)
        await chrome.storage.sync.clear()
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

        const oldStorage = new LocalStorage<IOldStorage>()
        const newStorage = new LocalStorage<INewStorage>()

        const excludedExtensions = await oldStorage.getItem(
          StorageItemKey.ExcludedExtensions
        )
        await newStorage.setItem(
          StorageItemKey.ExcludedExtensions
        , excludedExtensions ?? []
        )
      }
    })
  )
}
