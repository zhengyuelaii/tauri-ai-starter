const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = execSync('rustc -Vv').toString().match(/host: (\S+)/)[1];
const ext = process.platform === 'win32' ? '.exe' : '';
const src = path.join(__dirname, '..', 'dist-binary', `server${ext}`);
const destDir = path.join(__dirname, '..', '..', 'desktop', 'src-tauri', 'binaries');
const dest = path.join(destDir, `server-${target}${ext}`);

fs.mkdirSync(destDir, { recursive: true });
fs.renameSync(src, dest);
console.log(`Moved ${src} -> ${dest}`);
