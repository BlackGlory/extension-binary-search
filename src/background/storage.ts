import { IExtension, IStorage, StorageItemKey } from '@src/contract'
import { LocalStorage } from 'extra-webextension'

const storage = new LocalStorage<IStorage>()

export async function initStorage(): Promise<void> {
  await storage.setItem(StorageItemKey.ExcludedExtensions, [])
}

export async function getExcludedExtensions(): Promise<IExtension[]> {
  return await storage.getItem(StorageItemKey.ExcludedExtensions)
}

export async function setExcludedExtensions(
  excludedExtensions: IExtension[]
): Promise<null> {
  await storage.setItem(StorageItemKey.ExcludedExtensions, excludedExtensions)
  return null
}
