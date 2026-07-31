import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// The token stylesheet first: every component value is a var() reference into it.
import '@chameleon-labs/lattice-tokens/lattice.css'
import '../src/styles.css'

const container = document.getElementById('root')

if (container === null) {
  throw new Error('demo: #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <main>
      <h1>Lattice components</h1>
    </main>
  </StrictMode>
)
