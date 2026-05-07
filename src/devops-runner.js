import { getAuthToken } from './github-app-auth.js';

process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || await getAuthToken();

process.env.AGENT_DISPATCH_ROLE = process.env.AGENT_DISPATCH_ROLE || 'devops';

await import('./agent-dispatch-runner.js');
