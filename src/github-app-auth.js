import crypto from 'node:crypto';
import { githubRetryConfig, isRetriableStatus, retryAsync, retryableError } from './retry.js';

const REST_API = 'https://api.github.com';
const API_VERSION = '2026-03-10';
let cachedToken = null;
const RETRY = githubRetryConfig('AUTH');

function requiredEnv(name) {
  const value = (process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function privateKey() {
  return requiredEnv('APP_PRIVATE_KEY').replace(/\\n/g, '\n');
}

function appJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iat: now - 60,
    exp: now + 540,
    iss: requiredEnv('APP_ID'),
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey());
  return `${unsigned}.${base64url(signature)}`;
}

async function installationToken() {
  const installationId = requiredEnv('APP_INSTALLATION_ID');
  return retryAsync(
    async () => {
      let response;
      try {
        response = await fetch(`${REST_API}/app/installations/${installationId}/access_tokens`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${appJwt()}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': API_VERSION,
            'User-Agent': 'github-project-mcp',
          },
        });
      } catch (error) {
        throw retryableError(`GitHub App token request failed: ${error.message || error}`);
      }

      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        const message = JSON.stringify({ status: response.status, body: text }, null, 2);
        if (isRetriableStatus(response.status)) {
          throw retryableError(message);
        }
        throw new Error(message);
      }
      if (!response.ok) {
        const message = JSON.stringify({ status: response.status, body }, null, 2);
        if (isRetriableStatus(response.status)) {
          throw retryableError(message);
        }
        throw new Error(message);
      }

      return {
        token: body.token,
        expiresAt: new Date(body.expires_at).getTime(),
      };
    },
    { label: 'GitHub App installation token', ...RETRY }
  );
}

export async function getAuthToken() {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 120000) {
    return cachedToken.token;
  }
  cachedToken = await installationToken();
  return cachedToken.token;
}

export function githubApiVersion() {
  return API_VERSION;
}
