import { cp, mkdir } from 'node:fs/promises';

// Vercel serves this static output; server.mjs is only for local development.
const output = new URL('./dist/', import.meta.url);
await mkdir(output, { recursive: true });
for (const entry of ['index.html', 'css', 'js', 'data', 'assets', 'img']) {
  await cp(new URL(`./${entry}`, import.meta.url), new URL(entry, output), {
    recursive: true,
    filter: source => !source.endsWith('.md'),
  });
}
console.log('Site preparado em dist/ para publicação.');
