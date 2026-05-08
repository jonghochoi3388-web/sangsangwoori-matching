import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// .env.local → process.env (테스트 헬퍼의 Supabase 클라이언트가 사용)
try {
  const lines = readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n');
  for (const line of lines) {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0 && !line.trimStart().startsWith('#')) {
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    }
  }
} catch {}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
