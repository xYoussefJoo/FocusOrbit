// Import first in DB tests: loads .env.local the same way Next.js does.
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
