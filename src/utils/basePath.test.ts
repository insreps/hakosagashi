import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBaseUrl,
  parseHashOrPath,
  resolveAssetPath,
} from './basePath';

test('normalizeBaseUrl handles root, relative ./, and subpath bases', () => {
  assert.equal(normalizeBaseUrl(undefined), '/');
  assert.equal(normalizeBaseUrl('/'), '/');
  assert.equal(normalizeBaseUrl('./'), './');
  assert.equal(normalizeBaseUrl('.'), './');
  assert.equal(normalizeBaseUrl('hakosagashi'), '/hakosagashi/');
  assert.equal(normalizeBaseUrl('/hakosagashi/'), '/hakosagashi/');
});

test('resolveAssetPath prefixes root asset paths properly for ./ and / bases', () => {
  assert.equal(
    resolveAssetPath('/src/assets/images/hero_rehearsal_studio_1794981330144.jpg', './'),
    './src/assets/images/hero_rehearsal_studio_1794981330144.jpg'
  );
  assert.equal(
    resolveAssetPath('/src/assets/images/hero_rehearsal_studio_1794981330144.jpg', '/'),
    '/src/assets/images/hero_rehearsal_studio_1794981330144.jpg'
  );
  assert.equal(
    resolveAssetPath('/src/assets/images/hero_rehearsal_studio_1794981330144.jpg', '/hakosagashi/'),
    '/hakosagashi/src/assets/images/hero_rehearsal_studio_1794981330144.jpg'
  );
  assert.equal(
    resolveAssetPath('https://example.com/a.jpg', './'),
    'https://example.com/a.jpg'
  );
});

test('parseHashOrPath parses hash routes, query strings, sections, and path fallbacks', () => {
  assert.deepEqual(parseHashOrPath('#/search?q=%E6%A2%85%E7%94%B0', '/hakosagashi/', ''), {
    path: '/search',
    search: '?q=%E6%A2%85%E7%94%B0',
    sectionId: null,
  });
  assert.deepEqual(
    parseHashOrPath('#/rooms/geijutsusozokan-engeki-dai', '/hakosagashi/', ''),
    {
      path: '/rooms/geijutsusozokan-engeki-dai',
      search: '',
      sectionId: null,
    }
  );
  assert.deepEqual(parseHashOrPath('#features', '/hakosagashi/', ''), {
    path: '/',
    search: '',
    sectionId: 'features',
  });
  assert.deepEqual(parseHashOrPath('', '/search', '?q=test'), {
    path: '/search',
    search: '?q=test',
    sectionId: null,
  });
  assert.deepEqual(parseHashOrPath('', '/hakosagashi/', ''), {
    path: '/',
    search: '',
    sectionId: null,
  });
});
