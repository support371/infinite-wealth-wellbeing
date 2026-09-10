import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const publicSite = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const storePage = readFileSync(new URL('../src/StorePage.jsx', import.meta.url), 'utf8');
const publicStyles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

const serviceFilms = [
  'wealth-empowerment',
  'investment-strategy',
  'asset-protection',
  'financial-education',
  'business-wealth',
  'community-prosperity',
  'spiritual-healing',
  'energy-wellness',
  'herbal-medicine',
  'sound-therapy',
  'emotional-wellness',
  'holistic-coaching',
];

describe('public service media and Leonard Store connection', () => {
  it('ships a local film for every wealth and wellbeing service', () => {
    for (const slug of serviceFilms) {
      expect(existsSync(new URL(`../public/media/services/${slug}.mp4`, import.meta.url))).toBe(true);
      expect(publicSite).toContain(`/media/services/${slug}.mp4`);
    }
  });

  it('uses mobile-safe, accessible playback behavior', () => {
    expect(publicSite).toContain('playsInline');
    expect(publicSite).toContain('muted');
    expect(publicSite).toContain('IntersectionObserver');
    expect(publicStyles).toContain('prefers-reduced-motion: reduce');
  });

  it('connects the public store gateway to the identified Base44 catalog', () => {
    expect(storePage).toContain("createClient({ appId: STORE_APP_ID })");
    expect(storePage).toContain("store.entities.Product.filter({ in_stock: true }");
    expect(storePage).toContain("6a4b77b56397f06ba1da0abc");
    expect(publicSite).toContain('<Route path="/store"');
  });
});
