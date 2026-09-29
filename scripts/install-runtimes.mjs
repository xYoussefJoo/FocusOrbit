// Installs the languages the IDE can run into the Piston runner (docker compose service
// "runner"). Run once after `npm run runner:up`; packages persist in a Docker volume.
//
// Each language is a download of hundreds of MB into Docker's disk image, which lives on
// the system drive (C: on Windows). A full C: once broke Docker, so this script refuses
// to download anything when less than MIN_FREE_GB is free.
import { statfsSync } from 'node:fs';
import { homedir } from 'node:os';

const PISTON_URL = process.env.PISTON_URL ?? 'http://localhost:2000';
const MIN_FREE_GB = 5;

// Piston package names for the runtimes in src/data/runner.ts (dotnet → csharp.net).
const WANTED = ['dotnet', 'python', 'java'];

const available = await fetch(`${PISTON_URL}/api/v2/packages`).then((r) => r.json()).catch(() => null);
if (!Array.isArray(available)) {
  console.error(`Can't reach the runner at ${PISTON_URL}. Start it first: npm run runner:up`);
  process.exit(1);
}

for (const name of WANTED) {
  const versions = available.filter((p) => p.language === name);
  const latest = versions.sort((a, b) => b.language_version.localeCompare(a.language_version, undefined, { numeric: true }))[0];
  if (!latest) { console.warn(`- ${name}: not offered by this Piston version, skipped`); continue; }
  if (latest.installed) { console.log(`✓ ${name} ${latest.language_version} already installed`); continue; }

  // Docker Desktop keeps its disk under the user profile, so check that drive.
  const { bavail, bsize } = statfsSync(homedir());
  const freeGb = (bavail * bsize) / 1024 ** 3;
  if (freeGb < MIN_FREE_GB) {
    console.error(`✗ ${name}: only ${freeGb.toFixed(1)} GB free on the system drive (need ${MIN_FREE_GB} GB). Not downloading.`);
    continue;
  }

  process.stdout.write(`… installing ${name} ${latest.language_version} `);
  const res = await fetch(`${PISTON_URL}/api/v2/packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: name, version: latest.language_version }),
  });
  console.log(res.ok ? '✓' : `✗ (${res.status} ${await res.text()})`);
}
