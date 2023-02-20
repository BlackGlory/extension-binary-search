export enum StorageItemKey {
  ExcludedExtensions = 'excludedExtensions'
}

export interface IStorage {
  [StorageItemKey.ExcludedExtensions]: IExtension[]
}

export interface IExtension {
  name: string
  id: string
}

export interface IBackgroundAPI {
  searchExtension(): null
  loadExcludedExtensions(): IExtension[]
  saveExcludedExtensions(excludedExtensions: IExtension[]): null
}

export interface IDialogAPI {
  message(options: {
    title?: string
    text?: string
    buttonText: string
  }): null

  confirm(options: {
    title?: string
    text?: string
    button1Text: string
    button2Text: string
  }): boolean

  progress(options: {
    title?: string
    text?: string
    value: number
  }): null
}
