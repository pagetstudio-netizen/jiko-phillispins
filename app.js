import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, 'dist', 'index.cjs');

if (!existsSync(distPath)) {
  console.error('=== ERREUR: dist/index.cjs introuvable ===');
  console.error('Veuillez exécuter: npm install && npm run build');
  console.error('Chemin attendu:', distPath);
  process.exit(1);
}

import(distPath).catch((err) => {
  console.error('=== ERREUR au démarrage du serveur ===', err);
  process.exit(1);
});
