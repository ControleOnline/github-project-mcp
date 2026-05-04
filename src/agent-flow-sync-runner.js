import { getAuthToken } from './github-app-auth.js';

process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || await getAuthToken();

await import('../automate/scripts/agent-flow-sync.mjs');
