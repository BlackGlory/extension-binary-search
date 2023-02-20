import browser from 'webextension-polyfill'
import { IExtension, IStorage, StorageItemKey } from '@src/contract'

export async function initStorage(): Promise<void> {
  const storage: IStorage = {
    [StorageItemKey.ExcludedExtensions]: []
  }

  await browser.storage.local.set(storage)
}

export async function loadExcludedExtensions(): Promise<IExtension[]> {
  const storage = await browser.storage.local.get(StorageItemKey) as Pick<
    IStorage
  , StorageItemKey.ExcludedExtensions
  >

  return storage[StorageItemKey.ExcludedExtensions]
}

export async function saveExcludedExtensions(excludedExtensions: IExtension[]): Promise<null> {
  await browser.storage.local.set({
    [StorageItemKey.ExcludedExtensions]: excludedExtensions
  })
  return null
}
