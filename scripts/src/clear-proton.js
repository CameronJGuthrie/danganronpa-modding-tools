#!/usr/bin/env node

import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { findCompatDataDirectory } from './steam-paths.js';

function clearProtonCache() {
  if (process.platform !== 'linux') {
    console.log('Proton cache clearing is only needed on Linux. Skipping.');
    return;
  }

  console.log('Clearing Proton cache...');

  const compatData = findCompatDataDirectory();

  if (compatData) {
    console.log(`Found compatdata at: ${compatData}`);
    try {
      execSync(`rm -rf "${compatData}"`, { stdio: 'inherit' });
      console.log('✓ Cleared Proton compatdata (will rebuild on next game launch)');
    } catch (error) {
      console.error('✗ Failed to clear Proton cache');
      console.error('  You may need to run this with appropriate permissions');
      process.exit(1);
    }
  } else {
    console.log('No Proton cache found (this is normal if you haven\'t run the game yet)');
  }
}

clearProtonCache();
