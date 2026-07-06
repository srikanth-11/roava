/**
 * Roava brand mark — "R + compass" — single source of truth for every icon
 * asset. The letter R's diagonal leg IS the compass needle, pointing
 * south-east through the ring.
 *
 * Run: node scripts/generate-brand-assets.mjs
 * Regenerates: icon, Android adaptive foreground/monochrome, splash (light +
 * dark), favicon. The in-app <AppLogo/> mirrors this geometry — change both
 * together (components/shared/AppLogo.tsx).
 *
 * Per Expo SDK 57 docs: icon = 1024x1024 PNG, NO transparency; adaptive
 * foreground = transparent PNG, content inside the central ~66% safe zone;
 * splash = transparent PNG shown at imageWidth on a solid backgroundColor.
 */
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ORANGE = '#EA580C'; // brand primary (light theme value — matches palette.ts)
const SLATE = '#0F172A'; // foreground (light theme)
const LIGHT = '#F1F5F9'; // foreground (dark theme)
const CREAM = '#FFF7ED'; // background (light theme)

/**
 * The mark itself, parameterized by its two ink colors.
 * Canvas 1024x1024, ring outer edge at r=425 (83% of canvas).
 */
function mark({ ink, accent }) {
  return `
  <!-- compass ring -->
  <circle cx="512" cy="512" r="396" fill="none" stroke="${accent}" stroke-width="58"/>
  <!-- cardinal ticks, hugging the ring -->
  <g stroke="${ink}" stroke-width="30" stroke-linecap="round">
    <line x1="512" y1="190" x2="512" y2="248"/>
    <line x1="512" y1="776" x2="512" y2="834"/>
    <line x1="190" y1="512" x2="248" y2="512"/>
    <line x1="776" y1="512" x2="834" y2="512"/>
  </g>
  <!-- R: stem + bowl in ink (stem top flush with bowl bar) -->
  <g fill="none" stroke="${ink}" stroke-width="88" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 400 340 L 400 690"/>
    <path d="M 400 340 L 540 340 A 100 100 0 0 1 540 540 L 400 540"/>
  </g>
  <!-- R's leg = compass needle: one tapered blade, thin at the bowl,
       shouldered mid-way, sharp at the SE tip -->
  <polygon points="558,534 672,610 756,760 606,676 530,562" fill="${accent}"/>
  `;
}

function svg({ ink, accent, background = null, scale = 1 }) {
  const g =
    scale === 1
      ? mark({ ink, accent })
      : `<g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${mark({ ink, accent })}</g>`;
  const bg = background ? `<rect width="1024" height="1024" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${bg}${g}</svg>`;
}

function render(svgString, sizePx, outFile) {
  const resvg = new Resvg(svgString, { fitTo: { mode: 'width', value: sizePx } });
  const png = resvg.render().asPng();
  const out = resolve(import.meta.dirname, '..', 'assets', 'images', outFile);
  writeFileSync(out, png);
  console.log(`✓ ${outFile} (${sizePx}px, ${Math.round(png.length / 1024)} KB)`);
}

// Launcher icon: solid cream, full-size mark (OS applies its own masking).
render(svg({ ink: SLATE, accent: ORANGE, background: CREAM, scale: 0.92 }), 1024, 'icon.png');

// Android adaptive foreground: transparent, mark shrunk into the safe zone.
render(
  svg({ ink: SLATE, accent: ORANGE, scale: 0.7 }),
  1024,
  'android-icon-foreground.png',
);

// Android 13 themed icon: single-color silhouette.
render(svg({ ink: '#FFFFFF', accent: '#FFFFFF', scale: 0.7 }), 1024, 'android-icon-monochrome.png');

// Splash marks: transparent; ink flips per theme, accent stays brand orange.
render(svg({ ink: SLATE, accent: ORANGE }), 1024, 'splash-icon.png');
render(svg({ ink: LIGHT, accent: ORANGE }), 1024, 'splash-icon-dark.png');

// Web favicon.
render(svg({ ink: SLATE, accent: ORANGE, background: CREAM, scale: 0.92 }), 48, 'favicon.png');
