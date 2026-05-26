import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const distPath = join(__dirname, 'dist', 'index.cjs');

if (!existsSync(distPath)) {
  console.error('=== ERREUR: dist/index.cjs introuvable ===');
  console.error('Veuillez exécuter: npm install && npm run build');
  process.exit(1);
}

try {
  require(distPath);
} catch (err) {
  console.error('=== ERREUR au démarrage du serveur ===', err);
  process.exit(1);
}
