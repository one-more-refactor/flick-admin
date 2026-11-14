import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('nginx.conf security configuration', () => {
  const confPath = resolve(import.meta.dir, '../../deploy/nginx.conf');
  const conf = readFileSync(confPath, 'utf8');

  test('disables server_tokens to prevent server version disclosure', () => {
    expect(conf).toMatch(/^\s*server_tokens\s+off;/m);
  });

  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Cross-Origin-Opener-Policy',
    'Content-Security-Policy',
  ];

  test('defines all required security headers in server block', () => {
    for (const header of requiredHeaders) {
      expect(conf).toContain(`add_header ${header}`);
    }
  });

  test('repeats all security headers in location /assets/ to prevent Nginx header drop', () => {
    const assetsBlock = conf.match(/location\s+\/assets\/\s*\{([^}]+)\}/)?.[1];
    expect(assetsBlock).toBeDefined();
    for (const header of requiredHeaders) {
      expect(assetsBlock!).toContain(`add_header ${header}`);
    }
  });

  test('repeats all security headers in location / to prevent Nginx header drop', () => {
    const rootBlock = conf.match(/location\s+\/\s*\{([^}]+)\}/)?.[1];
    expect(rootBlock).toBeDefined();
    for (const header of requiredHeaders) {
      expect(rootBlock!).toContain(`add_header ${header}`);
    }
  });

  test('restricts Permissions-Policy camera, microphone, geolocation, and payment', () => {
    expect(conf).toMatch(/Permissions-Policy\s+"camera=\(\),\s*microphone=\(\),\s*geolocation=\(\),\s*payment=\(\)"/);
  });
});
