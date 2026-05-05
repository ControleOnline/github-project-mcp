import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const GRAPHQL_API_URL = 'https://api.github.com/graphql';
const REST_API_URL = 'https://api.github.com';
const DEFAULT_UNSUPPORTED_LABEL = 'ops:copilot-unavailable';
const ROLE_META = {
  developer: { displayName: 'Developer', label: 'agent:developer' },
  security: { displayName: 'Security', label: 'agent:security' },
  qa: { displayName: 'Quality Assurance', label: 'agent:qa' },
};
const ALL_AGENT_LABELS = Object.values(ROLE_META).map((entry) => entry.label);
const LABEL_META = {
  'ops:copilot-unavailable': {
    color: 'd4a72c',
    description: 'Copilot cloud agent nao habilitado no repositorio alvo',
  },
};

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function getToken() {
  return env('GITHUB_TOKEN') || env('GH_TOKEN');
}

function headers(extra = {}) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${getToken()}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'controleonline-agent-runner',
    ...extra,
  };
}

async function githubRest(pathname, options = {}) {
  const response = await fetch(`${REST_API_URL}${pathname}`, {
    ...options,
    headers: headers(options.headers || {}),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(JSON.stringify({ status: response.status, path: pathname, body }, null, 2));
  }
  return body;
}

async function githubGraphQL(query, variables = {}) {
  const response = await fetch(GRAPHQL_API_URL, {
    method: 'POST',
    headers: headers({
      'GraphQL-Features': 'issues_copilot_assignment_api_support,coding_agent_model_selection',
    }),
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify({ status: response.status, errors: json.errors || json }, null, 2));
  }
  return json.data;
}

async function ensureLabelExists(repoFullName, labelName) {
  const [owner, repo] = repoFullName.split('/');
  const meta = LABEL_META[labelName] || { color: '1f6feb', description: labelName };
  try {
    await githubRest(`/repos/${owner}/${repo}/labels`, {
      method: 'POST',
      body: JSON.stringify({
        name: labelName,
        color: meta.color,
        description: meta.description,
      }),
    });
  } catch (error) {
    const payload = JSON.parse(error.message || '{}');
    if (payload.status !== 422) throw error;
  }
}

async function replaceIssueLabels(repoFullName, issueNumber, nextLabels) {
  const [owner, repo] = repoFullName.split('/');
  await githubRest(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
    method: 'PUT',
    body: JSON.stringify(nextLabels),
  });
}

async function addIssueComment(issueId, body) {
  await githubGraphQL(
    `mutation($subjectId:ID!, $body:String!) {
      addComment(input:{subjectId:$subjectId, body:$body}) {
        commentEdge { node { id } }
      }
    }`,
    { subjectId: issueId, body }
  );
}

function outputPathForRole(role) {
  const outDir = env('AGENT_OUTPUT_DIR', '/tmp');
  return path.join(outDir, `agent-project-dispatch-${role}.json`);
}

function dispatchScriptPathForRole(role) {
  const relativePath = {
    developer: '../automate/agents/developer/dispatch.mjs',
    qa: '../automate/agents/qa/dispatch.mjs',
    security: '../automate/agents/security/dispatch.mjs',
  }[role] || '../automate/scripts/agent-project-dispatch.mjs';

  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath);
}

function runDispatchScript(role) {
  const scriptPath = dispatchScriptPathForRole(role);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code, signal) => resolve({ code: code ?? 1, signal }));
    child.on('error', (error) => resolve({ code: 1, error }));
  });
}

function buildUnavailableComment(role, issueRef, unsupportedLabel, preferredAgentLogin) {
  const meta = ROLE_META[role] || { displayName: role, label: `agent:${role}` };
  return [
    `### ${meta.displayName} iniciado - bloqueio operacional`,
    '',
    `Issue: ${issueRef}`,
    `Bloqueio: o repositório alvo não expôs o actor \`${preferredAgentLogin}\` em \`suggestedActors\` e também não havia assignee atual de agent reaproveitável para o papel \`${meta.displayName}\`.`,
    `Ação: a automação marcou a issue com \`${unsupportedLabel}\` e retirou o label \`${meta.label}\` para evitar looping automático até a habilitação operacional do Copilot agent nesse repositório.`,
    'Próximo passo: habilitar o Copilot agent no repositório alvo e depois devolver a task para `Work` ou reaplicar o label do agent correto.',
  ].join('\n');
}

function shouldSurfaceMissingActor(attempt) {
  return (
    attempt?.status === 'skipped' &&
    typeof attempt?.reason === 'string' &&
    attempt.reason.includes('não apareceu em suggestedActors')
  );
}

async function surfaceMissingActorBlocks(payload) {
  if (payload?.dryRun) return [];

  const unsupportedLabel = payload.unsupportedLabel || DEFAULT_UNSUPPORTED_LABEL;
  const preferredAgentLogin = env('AGENT_LOGIN', 'copilot-swe-agent').toLowerCase();
  const items = [...(payload.candidateItems || []), ...(payload.staleActiveItems || [])];
  const itemMap = new Map(items.map((item) => [item.issue.ref, item]));
  const surfaced = [];

  for (const attempt of payload.assignmentAttempts || []) {
    if (!shouldSurfaceMissingActor(attempt)) continue;

    const detail = itemMap.get(attempt.issue.ref);
    if (!detail?.issue?.id) continue;

    const [repoFullName, issueNumberText] = attempt.issue.ref.split('#');
    const issueNumber = Number(issueNumberText);
    if (!repoFullName || !issueNumber) continue;

    const nextLabels = [
      ...new Set([...(detail.labels || []).filter((label) => !ALL_AGENT_LABELS.includes(label)), unsupportedLabel]),
    ];

    await ensureLabelExists(repoFullName, unsupportedLabel);
    await replaceIssueLabels(repoFullName, issueNumber, nextLabels);
    await addIssueComment(
      detail.issue.id,
      buildUnavailableComment(payload.role, attempt.issue.ref, unsupportedLabel, preferredAgentLogin)
    );

    attempt.status = 'blocked';
    attempt.reason = `Repositório sem actor atribuível do Copilot cloud agent; issue marcada com ${unsupportedLabel}.`;
    surfaced.push(attempt.issue.ref);
  }

  return surfaced;
}

async function main() {
  const role = env('AGENT_DISPATCH_ROLE');
  if (!role) throw new Error('AGENT_DISPATCH_ROLE is required');

  const runResult = await runDispatchScript(role);
  if (runResult.code !== 0) {
    process.exit(runResult.code);
  }

  const outPath = outputPathForRole(role);
  if (!fs.existsSync(outPath)) {
    return;
  }

  const payload = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const surfaced = await surfaceMissingActorBlocks(payload);
  if (surfaced.length > 0) {
    payload.ok = true;
    payload.surfacedMissingActorBlocks = surfaced;
    payload.reason = `Tasks elegíveis encontradas sem actor atribuível do Copilot; bloqueios registrados em ${surfaced.join(', ')}.`;
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
    console.log(JSON.stringify({ ok: true, role, surfacedMissingActorBlocks: surfaced, outPath }, null, 2));
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
