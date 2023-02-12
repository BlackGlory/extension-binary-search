import '@src/globals.css'
import { createRoot } from 'react-dom/client'
import { Dialog } from '@components/dialog'
import { assert } from '@blackglory/prelude'

const main = document.querySelector('main')
assert(main, 'The main element not found')

const root = createRoot(main)
root.render(<Dialog />)
