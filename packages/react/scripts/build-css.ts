// tsc emits JavaScript and declarations but ignores CSS. The stylesheet is
// assembled here rather than by a bundler: an @import left in a published file
// would cost the consumer a request waterfall, and inlining keeps the shipped
// CSS readable by the static contract tests.
import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assembleCss} from './assemble-css.js';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

await mkdir(join(packageRoot, 'dist'), {recursive: true});
await writeFile(join(packageRoot, 'dist/styles.css'), await assembleCss(join(packageRoot, 'src/styles.css')));
