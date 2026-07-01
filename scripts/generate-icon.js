const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'assets', 'images', 'frozfit-icon.svg');
const iconOut = path.join(root, 'assets', 'images', 'icon.png');
const splashOut = path.join(root, 'assets', 'images', 'splash-icon.png');

async function main() {
  let Resvg;
  try {
    ({ Resvg } = require('@resvg/resvg-js'));
  } catch {
    console.log('📦 @resvg/resvg-js kuruluyor...');
    execSync('npm install --save-dev @resvg/resvg-js', { cwd: root, stdio: 'inherit' });
    ({ Resvg } = require('@resvg/resvg-js'));
  }

  const svgData = fs.readFileSync(svgPath, 'utf8');

  // 1024×1024 App Icon
  const icon = new Resvg(svgData, { width: 1024, height: 1024 });
  fs.writeFileSync(iconOut, icon.render().asPng());
  console.log('✅ assets/images/icon.png (1024×1024)');

  // 200×200 splash icon (centered on white/blue splash)
  const splash = new Resvg(svgData, { width: 200, height: 200 });
  fs.writeFileSync(splashOut, splash.render().asPng());
  console.log('✅ assets/images/splash-icon.png (200×200)');

  console.log('\n🎉 Bitti! EAS build öncesi dev server\'ı -c ile yeniden başlat.');
}

main().catch(e => { console.error(e); process.exit(1); });
