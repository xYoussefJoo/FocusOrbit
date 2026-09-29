// Copies the Monaco editor build into public/monaco so the app serves it itself.
// By default @monaco-editor/react downloads Monaco from a CDN (jsdelivr) on every
// visit, which is slow or stuck on a bad connection and breaks offline.
// Runs automatically before `dev` and `build` and after `npm install`; it skips the
// copy when public/monaco already has the installed version.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const version = JSON.parse(readFileSync('node_modules/monaco-editor/package.json', 'utf8')).version;
const marker = 'public/monaco/VERSION';

if (existsSync(marker) && readFileSync(marker, 'utf8') === version) process.exit(0);

rmSync('public/monaco', { recursive: true, force: true });
cpSync('node_modules/monaco-editor/min/vs', 'public/monaco/vs', { recursive: true });
writeFileSync(marker, version);
console.log(`Copied Monaco ${version} to public/monaco`);
