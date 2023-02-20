import { IExtension, IStorage, StorageItemKey } from '@src/contract'
import { LocalStorage } from 'extra-webextension'

const localStorage = new LocalStorage<IStorage>()

export async function initStorage(): Promise<void> {
  await localStorage.setItem(StorageItemKey.ExcludedExtensions, [])
}

export async function loadExcludedExtensions(): Promise<IExtension[]> {
  return await localStorage.getItem(StorageItemKey.ExcludedExtensions)
}

export async function saveExcludedExtensions(
  excludedExtensions: IExtension[]
): Promise<null> {
  await localStorage.setItem(StorageItemKey.ExcludedExtensions, excludedExtensions)
  return null
}
