import { spawn } from 'node:child_process';
import { githubRetryConfig, retryAsync, retryableError } from './retry.js';

const commandArgs = process.argv.slice(2);
if (commandArgs.length === 0) {
  console.error('Usage: node src/run-with-retry.js <command> [args...]');
  process.exit(1);
}

const [command, ...args] = commandArgs;
const RETRY = githubRetryConfig('WORKFLOW');

async function runCommand() {
  return retryAsync(
    async (attempt) =>
      new Promise((resolve, reject) => {
        const child = spawn(command, args, {
          stdio: 'inherit',
          shell: false,
          env: process.env,
        });

        child.on('error', (error) => {
          reject(retryableError(`Failed to start ${command}: ${error.message || error}`));
        });

        child.on('exit', (code, signal) => {
          if (code === 0) {
            resolve();
            return;
          }
          const suffix = signal ? `signal ${signal}` : `exit code ${code}`;
          reject(retryableError(`${command} failed on attempt ${attempt} with ${suffix}`));
        });
      }),
    { label: `workflow command ${command}`, ...RETRY }
  );
}

runCommand().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
