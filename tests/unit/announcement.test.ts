// Unit tests for announcement validation (src/announcement.ts).
// Covers every bypass the duplicate sentinel/* PRs (#59–#73) targeted.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLink, buildAnnouncement, LIMITS } from '../../src/announcement.ts';

describe('validateLink — accepted', () => {
  test('empty / blank means "no link"', () => {
    assert.equal(validateLink(''), '');
    assert.equal(validateLink('   '), '');
    assert.equal(validateLink(undefined), '');
    assert.equal(validateLink(null), '');
  });

  test('absolute http(s) URLs pass through trimmed', () => {
    assert.equal(validateLink('https://myflick.app/changelog'), 'https://myflick.app/changelog');
    assert.equal(validateLink('  http://example.test/a?b=1#c  '), 'http://example.test/a?b=1#c');
  });

  test('upper-case scheme is normalised so the backend prefix check accepts it', () => {
    assert.equal(validateLink('HTTPS://Example.test/Path'), 'https://Example.test/Path');
    assert.equal(validateLink('Http://example.test'), 'http://example.test');
  });
});

describe('validateLink — rejected', () => {
  const bad: Array<[string, string]> = [
    ['javascript:alert(1)', 'script scheme'],
    ['JaVaScRiPt:alert(1)', 'mixed-case script scheme'],
    ['data:text/html,<script>alert(1)</script>', 'data scheme'],
    ['vbscript:msgbox(1)', 'vbscript scheme'],
    ['java\tscript:alert(1)', 'tab inside scheme'],
    ['java\nscript:alert(1)', 'newline inside scheme'],
    ['java\u0000script:alert(1)', 'NUL inside scheme'],
    ['\u0001javascript:alert(1)', 'leading control char'],
    ['https://exa mple.test', 'space'],
    ['https://example.test/\u0085', 'C1 control char'],
    ['https://example.test/\u00a0x', 'non-breaking space'],
    ['ftp://example.test', 'non-http scheme'],
    ['mailto:ops@example.test', 'mailto'],
    ['//evil.test/x', 'protocol-relative'],
    ['/changelog', 'relative path (backend refuses it too)'],
    ['example.test', 'missing scheme'],
    ['https://', 'no host'],
    ['https://user:pass@example.test', 'embedded credentials'],
    ['https://' + 'a'.repeat(LIMITS.link), 'too long'],
  ];
  for (const [input, why] of bad) {
    test(why, () => assert.throws(() => validateLink(input), Error));
  }
});

describe('buildAnnouncement', () => {
  test('builds the backend body', () => {
    assert.deepEqual(
      buildAnnouncement({ text: 'v1.5 is out', link: 'https://myflick.app', label: 'notes', active: true }),
      { text: 'v1.5 is out', link: 'https://myflick.app', label: 'notes', active: true },
    );
  });

  test('missing / non-string values become empty, active becomes boolean', () => {
    assert.deepEqual(buildAnnouncement({ text: null, link: 5, active: 0 }), {
      text: '',
      link: '',
      label: '',
      active: false,
    });
  });

  test('a published banner needs text', () => {
    assert.throws(() => buildAnnouncement({ text: '   ', active: true }), /needs a message/);
    assert.doesNotThrow(() => buildAnnouncement({ text: '', active: false }));
  });

  test('byte limits mirror the backend (UTF-8 bytes, not characters)', () => {
    assert.doesNotThrow(() => buildAnnouncement({ text: 'x'.repeat(LIMITS.text) }));
    assert.throws(() => buildAnnouncement({ text: 'x'.repeat(LIMITS.text + 1) }), /too long/);
    // 'ä' is 2 bytes: 151 of them = 302 bytes > 300 even though it's 151 chars
    assert.throws(() => buildAnnouncement({ text: 'ä'.repeat(151) }), /too long/);
    assert.throws(() => buildAnnouncement({ label: 'x'.repeat(LIMITS.label + 1) }), /too long/);
  });

  test('an invalid link fails the whole save', () => {
    assert.throws(() => buildAnnouncement({ text: 'hi', link: 'javascript:alert(1)', active: true }));
  });
});
