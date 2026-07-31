// tsc emits JavaScript and declarations but ignores CSS, so the stylesheet is
// copied as a separate build step. No bundler stands between src and dist,
// which is what keeps the shipped file readable by the contract tests in #37.
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

await mkdir(join(packageRoot, 'dist'), { recursive: true })
await copyFile(join(packageRoot, 'src/styles.css'), join(packageRoot, 'dist/styles.css'))
