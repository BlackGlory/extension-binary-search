import browser from 'webextension-polyfill'

export function i18n(messageName: string): string {
  return browser.i18n.getMessage(messageName)
}
