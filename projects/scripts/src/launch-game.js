#!/usr/bin/env node

import { spawn } from 'child_process';

const DANGANRONPA_APP_ID = '413410';

console.log(`Launching Danganronpa (Steam App ID: ${DANGANRONPA_APP_ID}) in new terminal...`);

// Launch Steam in a new terminal window
const terminal = spawn('x-terminal-emulator', [
    '-e',
    `steam -applaunch ${DANGANRONPA_APP_ID}`
], {
    stdio: 'ignore',
    detached: true
});

terminal.unref();

console.log('Game launch initiated.');
