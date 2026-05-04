import { getAuthToken } from './github-app-auth.js';

process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || await getAuthToken();

process.env.AGENT_DISPATCH_ROLE = process.env.AGENT_DISPATCH_ROLE || 'qa';

await import('../automate/scripts/agent-project-dispatch.mjs');
