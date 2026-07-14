/**
 * App Store tanıtım görseli üretici — ham app ekran görüntülerini alıp
 * krem zemin + yeşil organik şekil + siyah çerçeveli telefon + kalın büyük
 * harf başlık düzeninde, yüklemeye hazır PNG'lere çevirir.
 *
 * Üretilen boyutlar:
 *   • 6.9" iPhone   → 1290×2796  → out/01.png …
 *   • 13"  iPad     → 2064×2752  → out/ipad-01.png …
 *   • Play telefon  → 1080×1920  → out/android-01.png …
 *   • Play 7" tablet  → 1920×1200 (yatay) → out/tablet7-01.png …
 *   • Play 10" tablet → 2560×1600 (yatay) → out/tablet10-01.png …
 *   • Play feature graphic + 512 ikon
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
  {
    // Google Play telefon görseli. Play 16:9/9:16 oran ve max 3840px ister;
    // 1080×1920 (tam 9:16) her cihazda temiz ölçeklenir ve Play'in önerdiği boyut.
    name: 'Android telefon',
    prefix: 'android-',
    W: 1080,
    H: 1920,
    phoneW: 876,
    phoneY: 560,
    titleY: 196,
    titleYNoBadge: 168,
    titleSize: 66,
    lineH: 78,
    subSize: 31,
    badgeY: 84,
    badgeH: 58,
  },
  {
    // Play 7" tablet. Yatay düzen: metin solda, telefon çerçevesi sağda.
    // Dikey tasarımı geniş tuvale germek ekranın yarısını boş bırakırdı.
    name: 'Play 7" tablet',
    prefix: 'tablet7-',
    W: 1920,
    H: 1200,
    landscape: true,
    titleSize: 76,
    lineH: 92,
    subSize: 34,
    badgeH: 62,
  },
  {
    name: 'Play 10" tablet',
    prefix: 'tablet10-',
    W: 2560,
    H: 1600,
    landscape: true,
    titleSize: 101,
    lineH: 122,
    subSize: 45,
    badgeH: 82,
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

/**
 * Yatay (tablet) tuval için arkaplan: solda metin bloğu, sağda yeşil organik alan
 * ve içine oturan telefon. Dikey `backgroundSvg`'nin aksine telefon tamamen görünür.
 */
function landscapeBackgroundSvg(slide, phone, t) {
  const { W, H } = t;
  const lines = slide.title.split('\n');
  const cs = t.titleSize / 76; // 7" tablete göre ölçek

  const padX = Math.round(0.055 * W);
  const badgeText = slide.badge;

  // Metin bloğunu dikeyde ortala: rozet + başlık satırları + alt başlık.
  const blockH =
    (badgeText ? t.badgeH + Math.round(46 * cs) : 0) + lines.length * t.lineH + Math.round(70 * cs);
  const blockTop = Math.round((H - blockH) / 2);

  let cursorY = blockTop;
  let badgeSvg = '';
  if (badgeText) {
    const tw = badgeText.length * 19 * cs + 80 * cs;
    badgeSvg = `<rect x="${padX}" y="${cursorY}" width="${tw}" height="${t.badgeH}" rx="${t.badgeH / 2}" fill="${INK}"/>
      <text x="${padX + tw / 2}" y="${cursorY + t.badgeH * 0.66}" text-anchor="middle" font-family="${FONT}"
            font-weight="600" font-size="${Math.round(32 * cs)}" fill="${CREAM}">${esc(badgeText)}</text>`;
    cursorY += t.badgeH + Math.round(46 * cs);
  }

  const titleBase = cursorY + t.titleSize;
  const titleTspans = lines
    .map((ln, i) => `<tspan x="${padX}" y="${titleBase + i * t.lineH}">${esc(ln)}</tspan>`)
    .join('');
  const subY = titleBase + (lines.length - 1) * t.lineH + Math.round(70 * cs);

  // Sağdaki yeşil alan: dikey dalga, sol kenarı yumuşak kıvrımlı.
  const blob = `M ${0.5 * W},0
                C ${0.44 * W},${0.3 * H} ${0.6 * W},${0.45 * H} ${0.53 * W},${0.7 * H}
                C ${0.49 * W},${0.88 * H} ${0.56 * W},${0.95 * H} ${0.55 * W},${H}
                L ${W},${H} L ${W},0 Z`;

  return Buffer.from(`
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  <path d="${blob}" fill="${BLOB}"/>

  <circle cx="${0.06 * W}" cy="${0.86 * H}" r="${Math.round(56 * cs)}" fill="${ORANGE}" opacity="0.13"/>
  <circle cx="${0.42 * W}" cy="${0.1 * H}" r="${Math.round(38 * cs)}" fill="${ORANGE}" opacity="0.1"/>
  ${sparkle(0.93 * W, 0.16 * H, 40 * cs, '#FFFFFF', 0.55)}
  ${sparkle(0.62 * W, 0.83 * H, 30 * cs, '#FFFFFF', 0.45)}
  ${sparkle(0.965 * W, 0.66 * H, 22 * cs, '#FFFFFF', 0.35)}
  ${sparkle(0.52 * W, 0.14 * H, 26 * cs, ORANGE, 0.85)}

  <rect x="${phone.x}" y="${phone.y}" width="${phone.w}" height="${phone.h}"
        rx="${Math.round(52 * cs)}" ry="${Math.round(52 * cs)}" fill="${BEZEL}"/>

  ${badgeSvg}
  <text font-family="${FONT}" font-weight="800" font-size="${t.titleSize}"
        fill="${INK}" letter-spacing="0.5">
    ${titleTspans}
  </text>
  <text x="${padX}" y="${subY}" font-family="${FONT}" font-weight="500"
        font-size="${t.subSize}" fill="${MUTED}">${esc(slide.subtitle)}</text>
</svg>`);
}

/** Üst köşeleri yuvarlak, altı düz (taştığı için) maske. */
function screenMask(w, visibleH, fullH, r) {
  return Buffer.from(
    `<svg width="${w}" height="${visibleH}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${fullH}" rx="${r}" ry="${r}"/></svg>`,
  );
}

/**
 * Play'in kabul ettiği formatta yaz: **32-bit PNG (RGBA), şeffaflık kullanılmadan**.
 *
 * Play alfa KANALININ VAR olmasını şart koşar (24-bit RGB dosyayı "çok küçük /
 * geçersiz" diye reddeder), ama şeffaf piksel İSTEMEZ. Yani önce kreme düzleştir,
 * sonra tam opak alfa kanalını geri ekle.
 */
async function writeOpaquePng(buffer, outPath) {
  await sharp(buffer).flatten({ background: CREAM }).ensureAlpha(1).png().toFile(outPath);
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

/**
 * Yatay (tablet) slayt. Telefon TAMAMEN görünür — tuval geniş olduğu için
 * dikeydeki "alttan taşır, kırp" numarasına gerek yok; ekran dört köşesi de
 * yuvarlak maskelenir.
 */
async function buildLandscapeSlide(slide, index, t, source, aspect) {
  const cs = t.titleSize / 76;
  const bezel = Math.round(17 * cs);

  // Telefon yüksekliği tuvalin %78'i; genişliği kaynağın oranından türer.
  const phoneH = Math.round(0.78 * t.H);
  const screenH = phoneH - bezel * 2;
  const screenW = Math.round(screenH * aspect);
  const phoneW = screenW + bezel * 2;

  const phoneX = Math.round(0.775 * t.W - phoneW / 2); // sağdaki yeşil alanın ortası
  const phoneY = Math.round((t.H - phoneH) / 2);
  const phone = { x: phoneX, y: phoneY, w: phoneW, h: phoneH };

  const radius = Math.round(38 * cs);
  const mask = Buffer.from(
    `<svg width="${screenW}" height="${screenH}" xmlns="http://www.w3.org/2000/svg"><rect width="${screenW}" height="${screenH}" rx="${radius}" ry="${radius}"/></svg>`,
  );

  const shot = await sharp(source)
    .resize(screenW, screenH, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const bg = await sharp(landscapeBackgroundSvg(slide, phone, t)).png().toBuffer();

  const outName = t.prefix + String(index + 1).padStart(2, '0') + '.png';
  const composed = await sharp(bg)
    .composite([{ input: shot, left: phoneX + bezel, top: phoneY + bezel }])
    .png()
    .toBuffer();
  await writeOpaquePng(composed, path.join(__dirname, 'out', outName));

  console.log(`✅ out/${outName}`);
  return true;
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

  if (t.landscape) return buildLandscapeSlide(slide, index, t, source, aspect);

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
  const composed = await sharp(bg)
    .composite([{ input: shot, left: screenX, top: screenY }])
    .png()
    .toBuffer();
  await writeOpaquePng(composed, path.join(__dirname, 'out', outName));

  console.log(`✅ out/${outName}`);
  return true;
}

/**
 * Google Play "feature graphic" — 1024×500, ZORUNLU.
 * Play bunu mağaza başlığında ve tanıtım yerleşimlerinde gösterir; üstüne kendi
 * oynat/yükle düğmelerini bindirebildiği için önemli içeriği ortadan uzak tutar,
 * kenarlarda güvenli boşluk bırakırız. Telefon çerçevesi yok — yatay marka afişi.
 */
async function buildFeatureGraphic() {
  const W = 1024;
  const H = 500;

  // Sağdaki organik yeşil alan: dikey dalga, soldan metne yer bırakır.
  const blob = `M ${0.52 * W},0
                C ${0.44 * W},${0.28 * H} ${0.66 * W},${0.42 * H} ${0.58 * W},${0.66 * H}
                C ${0.52 * W},${0.86 * H} ${0.62 * W},${0.94 * H} ${0.60 * W},${H}
                L ${W},${H} L ${W},0 Z`;

  const iconPath = path.join(__dirname, '..', 'assets', 'images', 'icon.png');
  const hasIcon = fs.existsSync(iconPath);

  const svg = Buffer.from(`
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  <path d="${blob}" fill="${BLOB}"/>

  <circle cx="${0.075 * W}" cy="${0.85 * H}" r="34" fill="${ORANGE}" opacity="0.14"/>
  ${sparkle(0.9 * W, 0.2 * H, 30, '#FFFFFF', 0.6)}
  ${sparkle(0.72 * W, 0.78 * H, 22, '#FFFFFF', 0.45)}
  ${sparkle(0.955 * W, 0.62 * H, 16, '#FFFFFF', 0.35)}
  ${sparkle(0.47 * W, 0.13 * H, 20, ORANGE, 0.85)}

  <text x="66" y="196" font-family="${FONT}" font-weight="800" font-size="82"
        fill="${INK}" letter-spacing="0.5">FrozFit</text>
  <text x="68" y="262" font-family="${FONT}" font-weight="700" font-size="35" fill="${INK}"
        opacity="0.9">Yapay zekâ beslenme ve</text>
  <text x="68" y="308" font-family="${FONT}" font-weight="700" font-size="35" fill="${INK}"
        opacity="0.9">fitness koçun</text>
  <text x="68" y="368" font-family="${FONT}" font-weight="500" font-size="27" fill="${MUTED}">Fotoğraf çek, kalorini öğren.</text>
  <text x="68" y="404" font-family="${FONT}" font-weight="500" font-size="27" fill="${MUTED}">Tarif al, hedefine ulaş.</text>
</svg>`);

  let img = sharp(svg).png();

  // Uygulama ikonunu sağdaki yeşil alana yuvarlak kart olarak yerleştir.
  if (hasIcon) {
    const S = 190;
    const rounded = Buffer.from(
      `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg"><rect width="${S}" height="${S}" rx="44" ry="44"/></svg>`,
    );
    const icon = await sharp(iconPath)
      .resize(S, S, { fit: 'cover' })
      .composite([{ input: rounded, blend: 'dest-in' }])
      .png()
      .toBuffer();
    img = sharp(await img.toBuffer()).composite([{ input: icon, left: 762, top: 155 }]);
  }

  const out = path.join(__dirname, 'out', 'play-feature-graphic.png');
  await writeOpaquePng(await img.png().toBuffer(), out);
  console.log(`✅ out/play-feature-graphic.png (1024×500)${hasIcon ? '' : '  [ikon bulunamadı, metin-only]'}`);
}

/** Play mağaza ikonu: 512×512. */
async function buildPlayIcon() {
  const iconPath = path.join(__dirname, '..', 'assets', 'images', 'icon.png');
  if (!fs.existsSync(iconPath)) {
    console.warn('⚠️  atlandı — assets/images/icon.png yok');
    return;
  }
  const resized = await sharp(iconPath).resize(512, 512, { fit: 'cover' }).png().toBuffer();
  await writeOpaquePng(resized, path.join(__dirname, 'out', 'play-icon-512.png'));
  console.log('✅ out/play-icon-512.png (512×512, 32-bit RGBA, opak)');
}

async function main() {
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  for (const t of TARGETS) {
    console.log(`\n── ${t.name} (${t.W}×${t.H}) ──`);
    for (let i = 0; i < SLIDES.length; i++) await buildSlide(SLIDES[i], i, t);
  }
  console.log('\n── Google Play varlıkları ──');
  await buildFeatureGraphic();
  await buildPlayIcon();
  console.log('\nBitti → store-assets/out/');
}

main().catch((e) => {
  console.error('❌', e.message || e);
  process.exit(1);
});
