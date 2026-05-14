import { getAuthToken } from './github-app-auth.js';

process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || await getAuthToken();
process.env.PR_REVIEW_ROLE = process.env.PR_REVIEW_ROLE || 'security';

await import('../automate/scripts/pr-label-review-runner.mjs');
