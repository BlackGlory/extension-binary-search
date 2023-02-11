import browser from 'webextension-polyfill'

export function getAllExtensions(): Promise<browser.Management.ExtensionInfo[]> {
  // all installed extensions, apps, themes
  return browser.management.getAll()
}

export async function getAllManageableExtensions(): Promise<
  browser.Management.ExtensionInfo[]
> {
  return (await getAllExtensions())
    // all extensions and apps
    .filter(x => ['extension', 'hosted_app'].includes(x.type))
    // except this extension
    .filter(x => x.id !== browser.runtime.id)
}
