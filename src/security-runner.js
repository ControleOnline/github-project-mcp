import { getAuthToken } from './github-app-auth.js';

process.env.TOKEN_PROJECTS = process.env.TOKEN_PROJECTS || await getAuthToken();

await import('../automate/scripts/security-project-review.mjs');
