import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('deploy/nginx.conf security headers', () => {
  const confPath = resolve(__dirname, '../deploy/nginx.conf');
  const conf = readFileSync(confPath, 'utf-8');

  test('config contains required security headers in server block and location blocks', () => {
    const requiredHeaders = [
      'X-Content-Type-Options "nosniff"',
      'X-Frame-Options "DENY"',
      'Referrer-Policy "no-referrer"',
      'Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"',
      "Content-Security-Policy \"default-src 'self'",
    ];

    for (const header of requiredHeaders) {
      // Must appear at least 3 times: server block, /assets/ location, and / location
      const matches = conf.match(new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('Permissions-Policy is present and restricts sensitive features', () => {
    expect(conf).toContain('add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;');
  });
});
