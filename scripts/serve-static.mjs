/**
 * A static file server for the browser suite, with no dependency.
 *
 * The suite used to run against `storybook dev`, which compiles a story's
 * module the first time it is asked for. That was the wall the parallelism hit:
 * eight workers meant eight simultaneous cold compiles, and the suite got
 * slower rather than faster (#105).
 *
 * Adding `serve` or `http-server` for this would be a devDependency in a
 * package that ships none of its own, to do something the standard library
 * already does.
 *
 * `--self-test` exercises the cases that are easy to get wrong and easy to
 * "verify" by reading a status code for the wrong reason.
 */
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import {extname, join, normalize, resolve, sep} from 'node:path';

const TYPES = new Map(
  Object.entries({
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
  }),
);

/**
 * A request path to a path inside `root`, or `undefined`.
 *
 * Note what this does *not* do: `new URL()` has already collapsed `..`, so
 * `/../../etc/passwd` arrives as `/etc/passwd` and joins to
 * `<root>/etc/passwd` — inside root, and refused later only because no such
 * file exists. The containment check catches what survives that collapsing,
 * such as an encoded separator, rather than the obvious traversal it looks
 * like it is for.
 */
export function resolveWithin(root, pathname) {
  let decoded;

  try {
    // Throws URIError on a malformed escape — `/%` is a real request a browser
    // can make, and an uncaught throw here would end the server mid-run.
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }

  const candidate = resolve(join(root, normalize(decoded)));

  return candidate === root || candidate.startsWith(`${root}${sep}`) ? candidate : undefined;
}

/** The file a request resolves to, following a directory to its index.html. */
async function fileFor(target) {
  const stats = await stat(target);

  if (!stats.isDirectory()) {
    return target;
  }

  const index = join(target, 'index.html');
  await stat(index);

  return index;
}

export function createStaticServer(root) {
  return createServer((request, response) => {
    const {pathname} = new URL(request.url ?? '/', 'http://localhost');
    const target = resolveWithin(root, pathname === '/' ? '/index.html' : pathname);

    if (target === undefined) {
      response.writeHead(400).end('bad request');
      return;
    }

    fileFor(target)
      .then((file) => {
        const stream = createReadStream(file);

        // Resolved and stat'd, but a read can still fail. Nothing is written
        // until the stream opens, so this can still answer 500 rather than
        // dying after a 200 has gone out.
        stream.once('error', () => {
          if (response.headersSent) {
            response.destroy();
          } else {
            response.writeHead(500).end('read error');
          }
        });

        stream.once('open', () => {
          response.writeHead(200, {
            'content-type': TYPES.get(extname(file)) ?? 'application/octet-stream',
            'cache-control': 'public, max-age=3600',
          });
          stream.pipe(response);
        });
      })
      .catch(() => {
        response.writeHead(404).end('not found');
      });
  });
}

async function selfTest() {
  const {mkdtemp, mkdir, writeFile} = await import('node:fs/promises');
  const {tmpdir} = await import('node:os');
  const assert = (await import('node:assert/strict')).default;

  const root = await mkdtemp(join(tmpdir(), 'serve-static-'));
  await writeFile(join(root, 'index.html'), '<!doctype html>root');
  await mkdir(join(root, 'empty'));

  const server = createStaticServer(root);
  await new Promise((done) => server.listen(0, done));
  const {port} = server.address();
  const get = async (path) => {
    const response = await fetch(`http://localhost:${port}${path}`);
    return response.status;
  };

  assert.equal(await get('/'), 200, 'serves the index');
  assert.equal(await get('/index.html?id=x&globals=theme:dark'), 200, 'ignores the query string');
  assert.equal(await get('/nope.js'), 404, 'misses are 404');
  // The three the review caught: each of these used to end the process.
  assert.equal(await get('/%'), 400, 'a malformed escape is refused, not thrown');
  assert.equal(await get('/empty'), 404, 'a directory with no index is 404, not a crash after 200');
  assert.equal(await get('/../../../etc/passwd'), 404, 'traversal reaches nothing');
  // Still listening: the point of the three above is that none of them killed it.
  assert.equal(await get('/'), 200, 'the server survived all of them');

  await new Promise((done) => server.close(done));
  console.log('serve-static: 7 checks passed');
}

if (process.argv[2] === '--self-test') {
  await selfTest();
} else {
  const [, , directoryArgument, portArgument] = process.argv;

  if (directoryArgument === undefined || portArgument === undefined) {
    console.error('usage: node scripts/serve-static.mjs <directory> <port>');
    process.exit(1);
  }

  const root = resolve(directoryArgument);

  createStaticServer(root).listen(Number(portArgument), () => {
    console.log(`serving ${root} on http://localhost:${portArgument}`);
  });
}
