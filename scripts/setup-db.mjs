/**
 * Script de configuration de la base de données Supabase
 * Exécutez via Plesk → Node.js → "Run Node.js commands"
 * Commande: node scripts/setup-db.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('=== Configuration de la base de données Noviqra AI ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ défini' : '✗ MANQUANT');

if (!process.env.DATABASE_URL) {
  console.error('ERREUR: DATABASE_URL doit être configuré dans les variables Plesk');
  process.exit(1);
}

const dbPush = spawn('npx', ['drizzle-kit', 'push', '--force'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: dirname(__dirname),
});

dbPush.on('close', (code) => {
  if (code === 0) {
    console.log('\n✓ Tables créées avec succès dans Supabase !');
    console.log('✓ Redémarrez maintenant l\'application dans Plesk');
    console.log('  → Le compte admin sera créé automatiquement au premier démarrage');
    console.log('  → Identifiants admin: 99935673 / AAbb11## (pays: Bénin)');
  } else {
    console.error('\n✗ Erreur lors de la création des tables (code:', code, ')');
    console.error('Vérifiez que DATABASE_URL est correct dans les variables Plesk');
  }
});
