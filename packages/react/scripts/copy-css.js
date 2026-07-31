// tsc emits JavaScript and declarations but ignores CSS. The stylesheet is
// assembled here rather than by a bundler: an @import left in a published file
// would cost the consumer a request waterfall, and inlining keeps the shipped
// CSS readable by the static contract tests.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const entry = join(packageRoot, 'src/styles.css')

const inline = async (file) => {
  const source = await readFile(file, 'utf8')
  const parts = []

  for (const line of source.split('\n')) {
    const match = /^@import\s+'([^']+)';/.exec(line.trim())

    if (match === null) {
      parts.push(line)
      continue
    }

    parts.push(await inline(resolve(dirname(file), match[1])))
  }

  return parts.join('\n')
}

await mkdir(join(packageRoot, 'dist'), { recursive: true })
await writeFile(join(packageRoot, 'dist/styles.css'), await inline(entry))
