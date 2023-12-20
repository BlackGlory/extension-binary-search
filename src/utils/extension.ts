export function getAllExtensions(): Promise<chrome.management.ExtensionInfo[]> {
  // all installed extensions, apps, themes
  return chrome.management.getAll()
}

export async function getAllManageableExtensions(): Promise<
  chrome.management.ExtensionInfo[]
> {
  return (await getAllExtensions())
    // all extensions and apps
    .filter(x => ['extension', 'hosted_app'].includes(x.type))
    // except this extension
    .filter(x => x.id !== chrome.runtime.id)
}
