/**
 * ensure-deps.cjs
 *
 * Reusable script that auto-installs dependencies if node_modules is missing.
 * Used by pre-start.cjs and can be required by other scripts.
 *
 * Usage:
 *   require('./scripts/ensure-deps.cjs');
 *   // or run directly: node scripts/ensure-deps.cjs
 */

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/**
 * Detects which package manager to use based on lockfiles present.
 * Priority: pnpm > yarn > npm
 */
function detectPackageManager() {
  if (fs.existsSync(path.join(ROOT, 'pnpm-lock.yaml'))) {
    return { pm: 'pnpm', args: ['install', '--frozen-lockfile'] };
  }
  if (fs.existsSync(path.join(ROOT, 'yarn.lock'))) {
    return { pm: 'yarn', args: ['install', '--frozen-lockfile'] };
  }
  return { pm: 'npm', args: ['ci'] };
}

/**
 * Checks whether dependencies are already installed.
 * Considers node_modules present + pnpm marker file as "installed".
 */
function areDepsInstalled() {
  const nmPath = path.join(ROOT, 'node_modules');
  if (!fs.existsSync(nmPath)) return false;

  // pnpm writes .modules.yaml; npm/yarn write .package-lock.json / .yarn-integrity
  const markers = [
    path.join(nmPath, '.modules.yaml'),        // pnpm
    path.join(nmPath, '.yarn-integrity'),      // yarn
    path.join(nmPath, '.package-lock.json'),   // npm v7+
  ];

  return markers.some((m) => fs.existsSync(m));
}

/**
 * Main: install if needed.
 * @param {object} [opts]
 * @param {boolean} [opts.silent=false] - suppress logs when already installed
 */
function ensureDeps(opts = {}) {
  if (areDepsInstalled()) {
    if (!opts.silent) {
      // no-op, deps are fine
    }
    return;
  }

  const { pm, args } = detectPackageManager();

  console.log('');
  console.log('📦 Зависимости не найдены. Запускаем установку...');
  console.log(`   Команда: ${pm} ${args.join(' ')}`);
  console.log('   Это займёт несколько минут при первом запуске.\n');

  const result = spawnSync(pm, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32', // shell: true needed on Windows
  });

  if (result.error) {
    console.error(`\n❌ Не удалось найти "${pm}". Установите его и повторите запуск.`);
    console.error(`   npm install -g ${pm}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error('\n❌ Установка завершилась с ошибкой.');
    console.error(`   Попробуйте вручную: ${pm} install`);
    process.exit(1);
  }

  console.log('\n✅ Зависимости установлены успешно!\n');
}

// Run immediately when called directly: node scripts/ensure-deps.cjs
if (require.main === module) {
  ensureDeps();
}

module.exports = { ensureDeps, areDepsInstalled, detectPackageManager };
