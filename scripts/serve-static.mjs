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

const [, , directoryArgument, portArgument] = process.argv;

if (directoryArgument === undefined || portArgument === undefined) {
  console.error('usage: node scripts/serve-static.mjs <directory> <port>');
  process.exit(1);
}

const root = resolve(directoryArgument);
const port = Number(portArgument);

/**
 * Resolve inside `root` or not at all. A request for `/../../etc/passwd`
 * normalises to an absolute path that fails this check rather than being served.
 */
function resolveWithin(pathname) {
  const candidate = resolve(join(root, normalize(decodeURIComponent(pathname))));

  return candidate === root || candidate.startsWith(`${root}${sep}`) ? candidate : undefined;
}

const server = createServer((request, response) => {
  // The query string is Storybook's story id, not part of the path.
  const {pathname} = new URL(request.url ?? '/', 'http://localhost');
  const target = resolveWithin(pathname === '/' ? '/index.html' : pathname);

  if (target === undefined) {
    response.writeHead(403).end('forbidden');
    return;
  }

  stat(target)
    .then((stats) => {
      const file = stats.isDirectory() ? join(target, 'index.html') : target;

      response.writeHead(200, {
        'content-type': TYPES.get(extname(file)) ?? 'application/octet-stream',
        // The suite reads the story index on every worker; nothing here changes
        // while it runs, and a rebuild starts a new server.
        'cache-control': 'public, max-age=3600',
      });
      createReadStream(file).pipe(response);
    })
    .catch(() => {
      response.writeHead(404).end('not found');
    });
});

server.listen(port, () => {
  console.log(`serving ${root} on http://localhost:${port}`);
});
