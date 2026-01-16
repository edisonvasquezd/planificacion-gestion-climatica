const fs = require('fs');
const path = require('path');

const openNextDir = path.join(__dirname, '..', '.open-next');
const deployDir = path.join(__dirname, '..', '.deploy');

// Clean deploy directory
if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true });
}
fs.mkdirSync(deployDir, { recursive: true });

// Copy assets
const assetsDir = path.join(openNextDir, 'assets');
if (fs.existsSync(assetsDir)) {
    copyDir(assetsDir, deployDir);
}

// Copy worker as _worker.js
const workerSrc = path.join(openNextDir, 'worker.js');
if (fs.existsSync(workerSrc)) {
    fs.copyFileSync(workerSrc, path.join(deployDir, '_worker.js'));
}

// Copy required directories
const dirs = ['server-functions', 'middleware', 'cloudflare', '.build'];
dirs.forEach(dir => {
    const src = path.join(openNextDir, dir);
    if (fs.existsSync(src)) {
        copyDir(src, path.join(deployDir, dir));
    }
});

console.log('Deploy folder prepared successfully!');

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
