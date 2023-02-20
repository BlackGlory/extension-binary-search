import { IExtension, IStorage, StorageItemKey } from '@src/contract'
import { LocalStorage } from 'extra-webextension'

const localStorage = new LocalStorage<IStorage>()

export async function initStorage(): Promise<void> {
  await localStorage.setItem(StorageItemKey.ExcludedExtensions, [])
}

export async function getExcludedExtensions(): Promise<IExtension[]> {
  return await localStorage.getItem(StorageItemKey.ExcludedExtensions)
}

export async function setExcludedExtensions(
  excludedExtensions: IExtension[]
): Promise<null> {
  await localStorage.setItem(StorageItemKey.ExcludedExtensions, excludedExtensions)
  return null
}
