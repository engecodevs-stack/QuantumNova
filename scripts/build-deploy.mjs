import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDeployDir = path.join(rootDir, 'dist_deploy');

console.log('🚀 Starting QuantumNova unified build for deployment...');

const clientDir = path.join(rootDir, 'client');

// 1. Ensure client dependencies are installed
if (!fs.existsSync(path.join(clientDir, 'node_modules'))) {
  console.log('📦 Installing client dependencies in', clientDir);
  execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
}

// 2. Build React client
console.log('📦 Building React client in', clientDir);
execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });

// 3. Prepare dist_deploy directory
if (fs.existsSync(distDeployDir)) {
  fs.rmSync(distDeployDir, { recursive: true, force: true });
}
fs.mkdirSync(distDeployDir, { recursive: true });

// 4. Copy Lobby to root of dist_deploy
const lobyDir = path.join(rootDir, 'Loby');
console.log('🌐 Copying Lobby static files to root...');
fs.cpSync(lobyDir, distDeployDir, { recursive: true });

// 5. Copy client/dist to dist_deploy/app
const clientDistDir = path.join(clientDir, 'dist');
const targetAppDir = path.join(distDeployDir, 'app');
console.log('⚛️ Copying React client build to /app...');
fs.cpSync(clientDistDir, targetAppDir, { recursive: true });

// 6. Copy Gnosis to dist_deploy/gnosis
const gnosisDir = path.join(rootDir, 'gnosis');
const targetGnosisDir = path.join(distDeployDir, 'gnosis');
console.log('🧠 Copying Gnosis files to /gnosis...');
fs.cpSync(gnosisDir, targetGnosisDir, { recursive: true });

console.log('✅ Deployment bundle successfully created in dist_deploy!');
