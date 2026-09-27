import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const distDeployDir = path.join(rootDir, 'dist_deploy');

console.log('🚀 Starting QuantumNova unified build for deployment...');

const clientDir = path.join(rootDir, 'client');
const serverDir = path.join(rootDir, 'server');

// 1. Build Server (TypeScript to JS for Vercel Serverless Function & standard node)
console.log('📦 Building Server in', serverDir);
if (!fs.existsSync(path.join(serverDir, 'node_modules'))) {
  console.log('📦 Installing server dependencies...');
  execSync('npm install', { cwd: serverDir, stdio: 'inherit' });
}
execSync('npm run build', { cwd: serverDir, stdio: 'inherit' });

// 2. Build React client
console.log('📦 Building React client in', clientDir);
if (!fs.existsSync(path.join(clientDir, 'node_modules'))) {
  console.log('📦 Installing client dependencies...');
  execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
}
execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });

// 3. Prepare static output directories (both public and dist_deploy)
for (const targetDir of [publicDir, distDeployDir]) {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy Lobby to root of targetDir
  const lobyDir = path.join(rootDir, 'Loby');
  console.log(`🌐 Copying Lobby static files to ${path.basename(targetDir)}...`);
  fs.cpSync(lobyDir, targetDir, { recursive: true });

  // Copy client/dist to targetDir/app
  const clientDistDir = path.join(clientDir, 'dist');
  const targetAppDir = path.join(targetDir, 'app');
  console.log(`⚛️ Copying React client build to ${path.basename(targetDir)}/app...`);
  fs.cpSync(clientDistDir, targetAppDir, { recursive: true });

  // Copy Gnosis to targetDir/gnosis
  const gnosisDir = path.join(rootDir, 'gnosis');
  const targetGnosisDir = path.join(targetDir, 'gnosis');
  console.log(`🧠 Copying Gnosis files to ${path.basename(targetDir)}/gnosis...`);
  fs.cpSync(gnosisDir, targetGnosisDir, { recursive: true });
}

console.log('✅ Deployment bundle successfully created in public and dist_deploy!');
