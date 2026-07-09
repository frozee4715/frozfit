/**
 * App Store tanıtım görseli üretici — ham app ekran görüntülerini alıp
 * krem zemin + yeşil organik şekil + siyah çerçeveli telefon + kalın büyük
 * harf başlık düzeninde, yüklemeye hazır PNG'lere çevirir.
 *
 * İki boyut üretir:
 *   • 6.9" iPhone → 1290×2796  → out/01.png …
 *   • 13"  iPad   → 2064×2752  → out/ipad-01.png …
 *
 * KULLANIM:
 *   1) Ham (tam çözünürlüklü) ekran görüntülerini  store-assets/raw/  içine koy.
 *   2) SLIDES dizisinde dosya adı + başlık eşleştir.
 *   3)  node store-assets/make-screenshots.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ── Palet (uygulamanın açık teması: yeşil primary + mercan aksan) ───────────
const CREAM = '#F7F4EC'; // krem zemin
const BLOB = '#4ADE9E'; // büyük organik şekil (taze yeşil)
const ORANGE = '#FF7043'; // mercan aksan (parlamalar)
const INK = '#0B241A'; // başlık metni (derin yeşil-siyah)
const MUTED = '#5F6B64'; // alt başlık
const BEZEL = '#141414'; // telefon çerçevesi

const FONT = 'Segoe UI, Arial, sans-serif';

/** Tüm kaynakları aynı orana getirmek için tepeden kırpılacak durum çubuğu yüksekliği. */
const STATUS_BAR_H = 133;

/**
 * Her hedef cihaz için tuval + yerleşim. iPad tuvali çok daha kare olduğundan
 * telefonu orantılı küçültüp başlığı yukarı çekiyoruz; yoksa cihaz ekranının
 * yarısı kırpılırdı.
 */
const TARGETS = [
  {
    name: 'iPhone 6.9"',
    prefix: '',
    W: 1290,
    H: 2796,
    phoneW: 1046,
    phoneY: 790,
    titleY: 268,
    titleYNoBadge: 232,
    titleSize: 80,
    lineH: 94,
    subSize: 37,
    badgeY: 118,
    badgeH: 70,
  },
  {
    name: 'iPad 13"',
    prefix: 'ipad-',
    W: 2064,
    H: 2752,
    phoneW: 1080,
    phoneY: 800,
    titleY: 300,
    titleYNoBadge: 264,
    titleSize: 92,
    lineH: 108,
    subSize: 42,
    badgeY: 130,
    badgeH: 80,
  },
];

// ── Görsel + metin eşleştirmesi ─────────────────────────────────────────────
// title: TÜRKÇE BÜYÜK HARFLE yaz (i→İ dikkat). \n ile satır böl.
const SLIDES = [
  {
    file: 'IMG_1380.PNG',
    badge: 'Yapay zekâ destekli',
    title: 'YAPAY ZEKÂ ŞEFİN\nCEBİNDE',
    subtitle: 'Sana özel tarifler, haftalık plan ve akıllı koç',
  },
  {
    file: 'discover.png',
    title: 'SAĞLIKLI TARİFLER\nPARMAK UCUNDA',
    subtitle: 'Kalorisi ve süresi belli yüzlerce tarif',
  },
  {
    file: 'track.png',
    title: 'KALORİNİ AKILLICA\nTAKİP ET',
    subtitle: 'Kalori, makro ve su takibi tek ekranda',
  },
  {
    file: 'workout.png',
    title: 'EVDE VİDEOLU\nANTRENMAN',
    subtitle: 'Her seviyeye uygun hareketler, adım adım',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Dört köşeli parlama (sparkle) yıldızı. */
function sparkle(cx, cy, r, color, opacity = 1) {
  const k = r * 0.16;
  return `<path d="M ${cx},${cy - r} Q ${cx + k},${cy - k} ${cx + r},${cy} Q ${cx + k},${cy + k} ${cx},${cy + r} Q ${cx - k},${cy + k} ${cx - r},${cy} Q ${cx - k},${cy - k} ${cx},${cy - r} Z" fill="${color}" opacity="${opacity}"/>`;
}

/** Arkaplan + şekiller + telefon çerçevesi + metinler. */
function backgroundSvg(slide, phone, t) {
  const { W, H } = t;
  const lines = slide.title.split('\n');

  const y = slide.badge ? t.titleY : t.titleYNoBadge;
  const titleTspans = lines
    .map((ln, i) => `<tspan x="${W / 2}" y="${y + i * t.lineH}">${esc(ln)}</tspan>`)
    .join('');
  const subY = y + (lines.length - 1) * t.lineH + Math.round(t.lineH * 0.83);

  const badgeSvg = slide.badge
    ? (() => {
        const cs = t.titleSize / 80; // iPhone'a göre ölçek
        const tw = slide.badge.length * 19 * cs + 80 * cs;
        const bx = (W - tw) / 2;
        return `<rect x="${bx}" y="${t.badgeY}" width="${tw}" height="${t.badgeH}" rx="${t.badgeH / 2}" fill="${INK}"/>
                <text x="${W / 2}" y="${t.badgeY + t.badgeH * 0.66}" text-anchor="middle" font-family="${FONT}"
                      font-weight="600" font-size="${Math.round(32 * cs)}" fill="${CREAM}">${esc(slide.badge)}</text>`;
      })()
    : '';

  // Telefonun oturduğu büyük organik dalga — tuval genişliğine göre esner.
  const blobTop = phone.y - 130;
  const blob = `M ${-0.05 * W},${blobTop + 130} C ${0.16 * W},${blobTop - 40} ${0.27 * W},${blobTop + 250} ${0.5 * W},${blobTop + 140}
                C ${0.71 * W},${blobTop + 40} ${0.84 * W},${blobTop + 300} ${1.05 * W},${blobTop + 150}
                L ${1.05 * W},${H + 60} L ${-0.05 * W},${H + 60} Z`;

  return Buffer.from(`
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>

  <!-- krem alandaki yumuşak daireler -->
  <circle cx="${0.915 * W}" cy="${phone.y - 260}" r="86" fill="${ORANGE}" opacity="0.16"/>
  <circle cx="${0.091 * W}" cy="${phone.y - 190}" r="52" fill="${ORANGE}" opacity="0.12"/>

  <!-- büyük organik dalga -->
  <path d="${blob}" fill="${BLOB}"/>

  <!-- parlamalar (dalganın üstünde, telefonun altında) -->
  ${sparkle(0.893 * W, phone.y - 70, 46, ORANGE, 0.95)}
  ${sparkle(0.071 * W, phone.y + 150, 36, '#FFFFFF', 0.55)}
  ${sparkle(0.938 * W, phone.y + 320, 28, '#FFFFFF', 0.45)}

  <!-- telefon gövdesi (alttan taşar, kırpılır) -->
  <rect x="${phone.x}" y="${phone.y}" width="${phone.w}" height="${phone.h}"
        rx="82" ry="82" fill="${BEZEL}"/>

  <!-- metinler -->
  ${badgeSvg}
  <text text-anchor="middle" font-family="${FONT}" font-weight="800"
        font-size="${t.titleSize}" fill="${INK}" letter-spacing="0.5">
    ${titleTspans}
  </text>
  <text x="${W / 2}" y="${subY}" text-anchor="middle" font-family="${FONT}"
        font-weight="500" font-size="${t.subSize}" fill="${MUTED}">${esc(slide.subtitle)}</text>
</svg>`);
}

/** Üst köşeleri yuvarlak, altı düz (taştığı için) maske. */
function screenMask(w, visibleH, fullH, r) {
  return Buffer.from(
    `<svg width="${w}" height="${visibleH}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${fullH}" rx="${r}" ry="${r}"/></svg>`,
  );
}

/** Durum çubuğu hâlâ duruyorsa kırp — böylece tüm kareler aynı orana gelir. */
async function normalizedSource(rawPath) {
  const meta = await sharp(rawPath).metadata();
  if (meta.height <= 2700) return rawPath;
  return sharp(rawPath)
    .extract({ left: 0, top: STATUS_BAR_H, width: meta.width, height: meta.height - STATUS_BAR_H })
    .png()
    .toBuffer();
}

async function buildSlide(slide, index, t) {
  const rawPath = path.join(__dirname, 'raw', slide.file);
  if (!fs.existsSync(rawPath)) {
    console.warn(`⚠️  atlandı — bulunamadı: raw/${slide.file}`);
    return false;
  }

  const source = await normalizedSource(rawPath);
  const meta = await sharp(source).metadata();
  const aspect = meta.width / meta.height;

  // Telefon: ekranın altından taşacak şekilde büyük.
  const bezel = 17;
  const phoneW = t.phoneW;
  const phoneX = Math.round((t.W - phoneW) / 2);
  const phoneY = t.phoneY;

  const screenW = phoneW - bezel * 2;
  const screenFullH = Math.round(screenW / aspect);
  const screenX = phoneX + bezel;
  const screenY = phoneY + bezel;
  const visibleH = Math.min(screenFullH, t.H - screenY); // taşan kısmı kırp

  const phone = { x: phoneX, y: phoneY, w: phoneW, h: screenFullH + bezel * 2 };

  const shot = await sharp(source)
    .resize(screenW, screenFullH, { fit: 'cover' })
    .extract({ left: 0, top: 0, width: screenW, height: visibleH })
    .composite([{ input: screenMask(screenW, visibleH, screenFullH, 66), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const bg = await sharp(backgroundSvg(slide, phone, t)).png().toBuffer();

  const outName = t.prefix + String(index + 1).padStart(2, '0') + '.png';
  await sharp(bg)
    .composite([{ input: shot, left: screenX, top: screenY }])
    .png()
    .toFile(path.join(__dirname, 'out', outName));

  console.log(`✅ out/${outName}`);
  return true;
}

async function main() {
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  for (const t of TARGETS) {
    console.log(`\n── ${t.name} (${t.W}×${t.H}) ──`);
    for (let i = 0; i < SLIDES.length; i++) await buildSlide(SLIDES[i], i, t);
  }
  console.log('\nBitti → store-assets/out/');
}

main().catch((e) => {
  console.error('❌', e.message || e);
  process.exit(1);
});
