import fs from 'node:fs';
import {
  githubRetryConfig,
  isRetriableGraphQLErrors,
  isRetriableStatus,
  retryAsync,
  retryableError,
} from '../../src/retry.js';

const GITHUB_API_URL = 'https://api.github.com/graphql';
const REST_API_URL = 'https://api.github.com';

const ROLE_META = {
  developer: {
    displayName: 'Developer',
    label: 'agent:developer',
    selection: 'work',
    commentHeader: 'Developer iniciado',
    nextInstruction:
      'Ao concluir, deixe comentário final objetivo, troque o label para `agent:security`, remova o assignee `Copilot` e preserve assignees humanos existentes.',
  },
  security: {
    displayName: 'Security',
    label: 'agent:security',
    selection: 'label',
    commentHeader: 'Security iniciado',
    nextInstruction:
      'Ao concluir, deixe comentário final objetivo, troque o label para `agent:qa` ou `agent:developer`, remova o assignee `Copilot` e preserve assignees humanos existentes.',
  },
  qa: {
    displayName: 'Quality Assurance',
    label: 'agent:qa',
    selection: 'label',
    commentHeader: 'Quality Assurance iniciado',
    nextInstruction:
      'Ao concluir, deixe comentário final objetivo, troque o label para `agent:devops`, `agent:security` ou `agent:developer`, remova o assignee `Copilot` e preserve assignees humanos existentes.',
  },
  devops: {
    displayName: 'DevOps',
    label: 'agent:devops',
    selection: 'label',
    commentHeader: 'DevOps iniciado',
    nextInstruction:
      'Ao concluir, deixe comentário final objetivo, mova a task para `In Review`, remova labels `agent:*`, remova o assignee `Copilot` e preserve assignees humanos existentes.',
  },
};

const ALL_AGENT_LABELS = Object.values(ROLE_META).map((entry) => entry.label);
const DEFAULT_AGENT_LOGIN = 'copilot-swe-agent';
const DEFAULT_KNOWN_AGENT_LOGINS = 'copilot-swe-agent,copilot';
const DEFAULT_STALE_AFTER_MINUTES = '30';
const DEFAULT_UNSUPPORTED_LABEL = 'ops:copilot-unavailable';
const RETRY = githubRetryConfig('AGENT');
const LABEL_META = {
  'agent:developer': { color: '1f6feb', description: 'Task atualmente com o agent Developer' },
  'agent:security': { color: 'd1242f', description: 'Task atualmente com o agent Security' },
  'agent:qa': { color: '8b5cf6', description: 'Task atualmente com o agent QA' },
  'agent:devops': { color: 'fb8c00', description: 'Task atualmente com o agent DevOps' },
  'ops:copilot-unavailable': {
    color: 'd4a72c',
    description: 'Copilot cloud agent nao habilitado no repositorio alvo',
  },
};

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function parseCsv(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function getRole() {
  const role = env('AGENT_DISPATCH_ROLE');
  if (!ROLE_META[role]) {
    throw new Error(`Unsupported AGENT_DISPATCH_ROLE: ${role}`);
  }
  return role;
}

function getToken() {
  return env('GITHUB_TOKEN') || env('GH_TOKEN');
}

function isCopilotUnavailableError(error) {
  const message = error?.message || String(error || '');
  return message.includes('Copilot agent is not enabled in this repository');
}

async function githubGraphQL(query, variables = {}, extraHeaders = {}) {
  const token = getToken();
  if (!token) throw new Error('Missing GitHub token. Set GITHUB_TOKEN or GH_TOKEN.');

  return retryAsync(
    async () => {
      let response;
      try {
        response = await fetch(GITHUB_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'controleonline-agent-dispatch',
            ...extraHeaders,
          },
          body: JSON.stringify({ query, variables }),
        });
      } catch (error) {
        throw retryableError(`GitHub GraphQL request failed: ${error.message || error}`);
      }

      const text = await response.text();
      let json;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        const message = JSON.stringify({ status: response.status, body: text }, null, 2);
        if (isRetriableStatus(response.status)) {
          throw retryableError(message);
        }
        throw new Error(message);
      }
      if (!response.ok || json.errors) {
        const message = JSON.stringify({ status: response.status, errors: json.errors || json }, null, 2);
        if ((!response.ok && isRetriableStatus(response.status)) || isRetriableGraphQLErrors(json.errors)) {
          throw retryableError(message);
        }
        throw new Error(message);
      }

      return json.data;
    },
    { label: 'GitHub GraphQL dispatch', ...RETRY }
  );
}

async function githubRest(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error('Missing GitHub token. Set GITHUB_TOKEN or GH_TOKEN.');

  return retryAsync(
    async () => {
      let response;
      try {
        response = await fetch(`${REST_API_URL}${path}`, {
          ...options,
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            'User-Agent': 'controleonline-agent-dispatch',
            ...(options.headers || {}),
          },
        });
      } catch (error) {
        throw retryableError(`GitHub REST request failed: ${error.message || error}`);
      }

      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        const message = JSON.stringify({ status: response.status, path, body: text }, null, 2);
        if (isRetriableStatus(response.status)) {
          throw retryableError(message);
        }
        throw new Error(message);
      }
      if (!response.ok) {
        const message = JSON.stringify({ status: response.status, path, body }, null, 2);
        if (isRetriableStatus(response.status)) {
          throw retryableError(message);
        }
        throw new Error(message);
      }
      return body;
    },
    { label: `GitHub REST dispatch ${path}`, ...RETRY }
  );
}

async function getProjectSnapshot(org, projectNumber) {
  const query = `query($org:String!, $projectNumber:Int!, $cursor:String) {
    organization(login:$org) {
      projectV2(number:$projectNumber) {
        id
        title
        items(first:100, after:$cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            fieldValues(first:20) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field {
                    ... on ProjectV2SingleSelectField {
                      id
                      name
                    }
                  }
                }
              }
            }
            content {
              ... on Issue {
                id
                number
                title
                url
                state
                createdAt
                updatedAt
                labels(first:20) {
                  nodes {
                    name
                  }
                }
                assignees(first:20) {
                  nodes {
                    id
                    login
                  }
                }
                repository {
                  id
                  nameWithOwner
                  suggestedActors(capabilities:[CAN_BE_ASSIGNED], first:20) {
                    nodes {
                      __typename
                      login
                      ... on Bot {
                        id
                      }
                      ... on User {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`;

  const firstPage = await githubGraphQL(query, { org, projectNumber, cursor: null });
  const project = firstPage?.organization?.projectV2;
  if (!project) return firstPage;

  const items = [...(project.items?.nodes || [])];
  let pageInfo = project.items?.pageInfo;

  while (pageInfo?.hasNextPage && pageInfo.endCursor) {
    const page = await githubGraphQL(query, { org, projectNumber, cursor: pageInfo.endCursor });
    const nextItems = page?.organization?.projectV2?.items?.nodes || [];
    items.push(...nextItems);
    pageInfo = page?.organization?.projectV2?.items?.pageInfo;
  }

  project.items.nodes = items;
  return firstPage;
}

function getStatusValue(item) {
  const value = item.fieldValues?.nodes?.find(
    (node) => node?.field?.name?.toLowerCase() === 'status'
  );
  return value?.name || null;
}

function issueLabels(issue) {
  return (issue.labels?.nodes || []).map((label) => label?.name).filter(Boolean);
}

function currentAgentLabel(issue) {
  return issueLabels(issue).find((label) => ALL_AGENT_LABELS.includes(label)) || null;
}

function assigneeLogins(issue) {
  return (issue.assignees?.nodes || [])
    .map((assignee) => (assignee?.login || '').trim().toLowerCase())
    .filter(Boolean);
}

function serializeAssigneeActors(issue) {
  return (issue.assignees?.nodes || [])
    .map((assignee) => ({
      id: assignee?.id || null,
      login: (assignee?.login || '').trim().toLowerCase(),
    }))
    .filter((assignee) => assignee.login);
}

function hasAgentAssignee(issue, knownAgentLogins) {
  return assigneeLogins(issue).some((login) => knownAgentLogins.has(login));
}

function hasHumanAssignee(issue, knownAgentLogins) {
  return assigneeLogins(issue).some((login) => !knownAgentLogins.has(login));
}

function hasHumanOnlyAssignee(issue, knownAgentLogins) {
  return hasHumanAssignee(issue, knownAgentLogins) && !hasAgentAssignee(issue, knownAgentLogins);
}

function retainedHumanActorIds(issue, knownAgentLogins) {
  return (issue.assignees?.nodes || [])
    .filter((assignee) => {
      const login = (assignee?.login || '').trim().toLowerCase();
      return login && !knownAgentLogins.has(login) && assignee?.id;
    })
    .map((assignee) => assignee.id);
}

function technicalAgentLogins(issue, knownAgentLogins) {
  return [...new Set(
    (issue.assignees?.nodes || [])
      .map((assignee) => (assignee?.login || '').trim().toLowerCase())
      .filter((login) => login && knownAgentLogins.has(login))
  )];
}

function getAssignableActor(issue, preferredAgentLogin) {
  return (issue.repository?.suggestedActors?.nodes || []).find(
    (actor) => actor?.login?.toLowerCase() === preferredAgentLogin
  );
}

function getAssignedAgentActor(issue, knownAgentLogins, preferredAgentLogin) {
  const assignees = issue.assignees?.nodes || [];
  const preferred = assignees.find(
    (assignee) => assignee?.id && (assignee?.login || '').trim().toLowerCase() === preferredAgentLogin
  );
  if (preferred) return preferred;

  return assignees.find((assignee) => {
    const login = (assignee?.login || '').trim().toLowerCase();
    return assignee?.id && knownAgentLogins.has(login);
  });
}

function getDispatchActor(issue, knownAgentLogins, preferredAgentLogin) {
  return getAssignableActor(issue, preferredAgentLogin) || getAssignedAgentActor(issue, knownAgentLogins, preferredAgentLogin);
}

function sortByCreatedAt(items) {
  return [...items].sort((left, right) => {
    const leftTs = Date.parse(left.content?.createdAt || '') || 0;
    const rightTs = Date.parse(right.content?.createdAt || '') || 0;
    return leftTs - rightTs;
  });
}

function minutesSince(value) {
  const timestamp = Date.parse(value || '');
  if (!timestamp) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
}

function isStaleActiveForRole(item, role, knownAgentLogins, staleAfterMinutes) {
  if (!isActiveForRole(item, role, knownAgentLogins)) return false;
  const ageMinutes = minutesSince(item.content?.updatedAt);
  return ageMinutes !== null && ageMinutes >= staleAfterMinutes;
}

function isEligibleForRole(item, role, workStatus, knownAgentLogins) {
  const issue = item.content;
  if (!issue?.repository?.nameWithOwner) return false;
  if (issue.state !== 'OPEN') return false;

  const stageLabel = currentAgentLabel(issue);
  const roleLabel = ROLE_META[role].label;
  const agentAssigned = hasAgentAssignee(issue, knownAgentLogins);
  const humanOnlyAssigned = hasHumanOnlyAssignee(issue, knownAgentLogins);

  if (stageLabel === roleLabel) {
    return !agentAssigned;
  }

  if (role === 'developer') {
    const status = getStatusValue(item);
    if (status?.toLowerCase() !== workStatus.toLowerCase()) return false;
    if (stageLabel) return false;
    if (humanOnlyAssigned) return false;
    return !agentAssigned;
  }

  return false;
}

function isActiveForRole(item, role, knownAgentLogins) {
  const issue = item.content;
  if (!issue?.repository?.nameWithOwner) return false;
  if (issue.state !== 'OPEN') return false;
  if (!hasAgentAssignee(issue, knownAgentLogins)) return false;
  return currentAgentLabel(issue) === ROLE_META[role].label;
}

function buildAgentInstructions(role, issueRef, issueNumber, mode = 'dispatch') {
  const meta = ROLE_META[role];
  const agentFile = `.github/agents/${role}.agent.md`;
  const prefix =
    mode === 'recovery'
      ? `Retome a execução travada ou devolvida para o agent ${meta.displayName} na issue ${issueRef}.`
      : `Atue como o agent ${meta.displayName} da ControleOnline para a issue ${issueRef}.`;

  return [
    prefix,
    `Antes de agir, leia e siga \`${agentFile}\` no repositório alvo.`,
    'Leia também o `AGENTS.md` mais específico do código afetado.',
    `Trabalhe a partir do branch \`task-${issueNumber}\` derivado de \`master\` quando a tarefa exigir mudanças.`,
    'Use GitHub como fonte de verdade para issue, PR, comentários, branch, labels e evidências.',
    mode === 'recovery'
      ? 'Se a issue foi devolvida manualmente, trate isso como correção normal do fluxo; revise o histórico recente e continue sem esperar intervenção humana.'
      : '',
    meta.nextInstruction,
  ]
    .filter(Boolean)
    .join(' ');
}

function buildAssignmentComment(role, issueRef) {
  const meta = ROLE_META[role];
  const origin =
    role === 'developer'
      ? 'Origem: fila `Work` do ProjectV2'
      : `Origem: label \`${meta.label}\``;

  return [
    `### ${meta.commentHeader}`,
    '',
    `Issue: ${issueRef}`,
    origin,
    'Critério: task elegível, sem ownership exclusivamente humano e sem outra execução ativa do mesmo agent.',
    `Ação: o runner atribuiu o agent \`${meta.displayName}\` para iniciar a execução.`,
  ].join('\n');
}

function buildRecoveryComment(role, issueRef, staleAfterMinutes, updatedAt) {
  const meta = ROLE_META[role];
  const ageMinutes = minutesSince(updatedAt);
  return [
    `### ${meta.commentHeader} - retomada automática`,
    '',
    `Issue: ${issueRef}`,
    `Origem: execução ativa em \`${meta.label}\` sem avanço recente.`,
    `Critério: issue ainda aberta, com assignee de agent, parada há ${ageMinutes ?? 'tempo indeterminado'} minutos; limite configurado: ${staleAfterMinutes} minutos.`,
    `Ação: o runner reatribuiu o agent \`${meta.displayName}\` para retomar a execução em vez de bloquear a fila.`,
  ].join('\n');
}

function buildUnavailableComment(role, issueRef, unsupportedLabel) {
  const meta = ROLE_META[role];
  return [
    `### ${meta.commentHeader} - bloqueio operacional`,
    '',
    `Issue: ${issueRef}`,
    `Bloqueio: o repositório alvo não aceita atribuição do Copilot cloud agent para o papel \`${meta.displayName}\`.`,
    `Ação: a automação marcou a issue com \`${unsupportedLabel}\`, retirou o label \`${meta.label}\` e tentou remover o assignee técnico do Copilot, preservando assignees humanos quando a API do repositório permitiu.`,
    'Próximo passo: habilitar o Copilot agent neste repositório e depois devolver a task para `Work` ou reaplicar o label do agent correto.',
  ].join('\n');
}

function buildOverrideComment(role, issueRef, overrideLogin) {
  const meta = ROLE_META[role];
  return [
    `### ${meta.commentHeader} - modo override`,
    '',
    `Issue: ${issueRef}`,
    `Modo: atribuição manual via \`AGENT_ASSIGNEE_OVERRIDE\` (Copilot cloud agent não disponível no repositório alvo).`,
    `Ação: o runner atribuiu \`${overrideLogin}\` como responsável pelo papel \`${meta.displayName}\`.`,
    meta.nextInstruction,
  ].join('\n');
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

async function removeIssueAssignees(repoFullName, issueNumber, assignees) {
  if (!assignees.length) return;
  const [owner, repo] = repoFullName.split('/');
  await githubRest(`/repos/${owner}/${repo}/issues/${issueNumber}/assignees`, {
    method: 'DELETE',
    body: JSON.stringify({ assignees }),
  });
}

async function resolveUserActor(login) {
  try {
    const data = await githubRest(`/users/${login}`);
    if (!data?.node_id) return null;
    return { id: data.node_id, login: login.toLowerCase() };
  } catch {
    return null;
  }
}

async function replaceAssignableActors(issueId, actorIds) {
  return githubGraphQL(
    `mutation($issueId:ID!, $actorIds:[ID!]!) {
      replaceActorsForAssignable(input: {
        assignableId: $issueId,
        actorIds: $actorIds
      }) {
        assignable {
          ... on Issue {
            id
          }
        }
      }
    }`,
    { issueId, actorIds }
  );
}

async function assignIssueToAgent(issueId, actorIds, repositoryId, baseRef, customInstructions, model) {
  return githubGraphQL(
    `mutation(
      $issueId:ID!,
      $actorIds:[ID!]!,
      $repositoryId:ID!,
      $baseRef:String!,
      $customInstructions:String!,
      $model:String
    ) {
      replaceActorsForAssignable(input: {
        assignableId: $issueId,
        actorIds: $actorIds,
        agentAssignment: {
          targetRepositoryId: $repositoryId,
          baseRef: $baseRef,
          customInstructions: $customInstructions,
          model: $model
        }
      }) {
        assignable {
          ... on Issue {
            id
          }
        }
      }
    }`,
    { issueId, actorIds, repositoryId, baseRef, customInstructions, model: model || null },
    {
      'GraphQL-Features': 'issues_copilot_assignment_api_support,coding_agent_model_selection',
    }
  );
}

async function addIssueComment(issueId, body) {
  return githubGraphQL(
    `mutation($subjectId:ID!, $body:String!) {
      addComment(input:{subjectId:$subjectId, body:$body}) {
        commentEdge {
          node {
            id
          }
        }
      }
    }`,
    { subjectId: issueId, body }
  );
}

function serializeItem(item, knownAgentLogins, preferredAgentLogin, staleAfterMinutes = null) {
  const issue = item.content;
  const suggestedActor = getAssignableActor(issue, preferredAgentLogin);
  const assignedAgentActor = getAssignedAgentActor(issue, knownAgentLogins, preferredAgentLogin);
  const actor = suggestedActor || assignedAgentActor;
  const ageMinutes = minutesSince(issue.updatedAt);
  return {
    issue: {
      id: issue.id,
      ref: `${issue.repository.nameWithOwner}#${issue.number}`,
      title: issue.title,
      url: issue.url,
      state: issue.state,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      ageMinutes,
    },
    projectItemId: item.id,
    currentProjectStatus: getStatusValue(item),
    labels: issueLabels(issue),
    currentAgentLabel: currentAgentLabel(issue),
    assignees: assigneeLogins(issue),
    assigneeActors: serializeAssigneeActors(issue),
    suggestedActors: (issue.repository?.suggestedActors?.nodes || [])
      .map((candidate) => candidate?.login)
      .filter(Boolean),
    hasAgentAssignee: hasAgentAssignee(issue, knownAgentLogins),
    hasHumanAssignee: hasHumanAssignee(issue, knownAgentLogins),
    hasHumanOnlyAssignee: hasHumanOnlyAssignee(issue, knownAgentLogins),
    canAssignPreferredAgent: Boolean(actor?.id),
    dispatchActorSource: suggestedActor ? 'suggestedActors' : assignedAgentActor ? 'currentAgentAssignee' : null,
    staleAfterMinutes,
    isStale: staleAfterMinutes ? ageMinutes !== null && ageMinutes >= staleAfterMinutes : null,
  };
}

function writeOutputFile(payload) {
  const outDir = env('AGENT_OUTPUT_DIR', '/tmp');
  const outPath = `${outDir}/agent-project-dispatch-${payload.role}.json`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  return outPath;
}

async function main() {
  const role = getRole();
  const meta = ROLE_META[role];
  const org = env('AGENT_PROJECT_ORG', 'ControleOnline');
  const projectNumber = Number(env('AGENT_PROJECT_NUMBER', '1'));
  const dryRun = env('AGENT_DRY_RUN', 'true').toLowerCase() !== 'false';
  const workStatus = env('AGENT_WORK_STATUS', 'Work');
  const preferredAgentLogin = env('AGENT_LOGIN', DEFAULT_AGENT_LOGIN).toLowerCase();
  const knownAgentLogins = new Set(
    parseCsv(env('AGENT_KNOWN_LOGINS', DEFAULT_KNOWN_AGENT_LOGINS)).map((login) => login.toLowerCase())
  );
  const baseRef = env('AGENT_COPILOT_BASE_REF', 'master');
  const model = env('AGENT_COPILOT_MODEL');
  const staleAfterMinutes = parsePositiveNumber(env('AGENT_STALE_AFTER_MINUTES', DEFAULT_STALE_AFTER_MINUTES), 30);
  const redispatchStaleActive = env('AGENT_REDISPATCH_STALE_ACTIVE', 'true').toLowerCase() !== 'false';
  const unsupportedLabel = env('AGENT_UNSUPPORTED_LABEL', DEFAULT_UNSUPPORTED_LABEL);

  const assigneeOverrideLogin = env('AGENT_ASSIGNEE_OVERRIDE', '').toLowerCase();
  let overrideActor = null;
  if (assigneeOverrideLogin) {
    overrideActor = await resolveUserActor(assigneeOverrideLogin);
    if (overrideActor) {
      knownAgentLogins.add(assigneeOverrideLogin);
    }
  }

  const data = await getProjectSnapshot(org, projectNumber);
  const project = data?.organization?.projectV2;
  if (!project) throw new Error(`Project not found: ${org}/projects/${projectNumber}`);

  const items = sortByCreatedAt(project.items?.nodes || []);
  const hasUnsupportedLabel = (item) => issueLabels(item.content).includes(unsupportedLabel);
  const unsupportedItems = items.filter((item) => hasUnsupportedLabel(item));
  const activeItems = items.filter(
    (item) => !hasUnsupportedLabel(item) && isActiveForRole(item, role, knownAgentLogins)
  );
  const staleActiveItems = redispatchStaleActive
    ? activeItems.filter((item) => isStaleActiveForRole(item, role, knownAgentLogins, staleAfterMinutes))
    : [];
  const staleActiveIds = new Set(staleActiveItems.map((item) => item.id));
  const freshActiveItems = activeItems.filter((item) => !staleActiveIds.has(item.id));
  const candidateItems = items.filter(
    (item) => !hasUnsupportedLabel(item) && isEligibleForRole(item, role, workStatus, knownAgentLogins)
  );
  const targetItems = [...staleActiveItems, ...candidateItems];

  const result = {
    generatedAt: new Date().toISOString(),
    role,
    dryRun,
    project: {
      org,
      number: projectNumber,
      id: project.id,
      title: project.title,
    },
    workStatus,
    roleLabel: meta.label,
    unsupportedLabel,
    staleAfterMinutes,
    redispatchStaleActive,
    activeCount: activeItems.length,
    freshActiveCount: freshActiveItems.length,
    staleActiveCount: staleActiveItems.length,
    unsupportedCount: unsupportedItems.length,
    candidateCount: candidateItems.length,
    activeItems: activeItems.map((item) => serializeItem(item, knownAgentLogins, preferredAgentLogin, staleAfterMinutes)),
    staleActiveItems: staleActiveItems.map((item) => serializeItem(item, knownAgentLogins, preferredAgentLogin, staleAfterMinutes)),
    unsupportedItems: unsupportedItems.map((item) => serializeItem(item, knownAgentLogins, preferredAgentLogin, staleAfterMinutes)),
    candidateItems: candidateItems.map((item) => serializeItem(item, knownAgentLogins, preferredAgentLogin, staleAfterMinutes)),
    assignmentAttempts: [],
  };

  if (freshActiveItems.length > 0) {
    result.ok = true;
    result.skipped = true;
    const refs = freshActiveItems
      .slice(0, 5)
      .map((item) => `${item.content.repository.nameWithOwner}#${item.content.number}`)
      .join(', ');
    result.reason = `Já existe task recente em execução pelo agent ${meta.displayName}: ${refs}.`;
    const outPath = writeOutputFile(result);
    console.log(JSON.stringify({ ok: true, skipped: true, reason: result.reason, outPath }, null, 2));
    return;
  }

  if (targetItems.length === 0) {
    result.ok = true;
    result.skipped = true;
    result.reason = `Nenhuma task elegível ou execução travada foi encontrada para ${meta.displayName}.`;
    const outPath = writeOutputFile(result);
    console.log(JSON.stringify({ ok: true, skipped: true, reason: result.reason, outPath }, null, 2));
    return;
  }

  for (const target of targetItems) {
    const issue = target.content;
    const issueRef = `${issue.repository.nameWithOwner}#${issue.number}`;
    const rawActor = getDispatchActor(issue, knownAgentLogins, preferredAgentLogin);
    const isOverride = !rawActor?.id && Boolean(overrideActor?.id);
    const actor = rawActor || (isOverride ? overrideActor : null);
    const targetRecord = serializeItem(target, knownAgentLogins, preferredAgentLogin, staleAfterMinutes);
    const mode = staleActiveIds.has(target.id) ? 'recovery' : 'dispatch';

    if (!actor?.id) {
      result.assignmentAttempts.push({
        issue: targetRecord.issue,
        status: 'skipped',
        reason: `O agent ${preferredAgentLogin} não apareceu em suggestedActors nem como assignee atual de agent para ${issue.repository.nameWithOwner}.`,
        suggestedActors: targetRecord.suggestedActors,
        assignees: targetRecord.assignees,
      });
      continue;
    }

    const currentLabels = issueLabels(issue);
    const nextLabels = [...new Set([...currentLabels.filter((label) => !ALL_AGENT_LABELS.includes(label)), meta.label])];
    const blockedLabels = [
      ...new Set([...currentLabels.filter((label) => !ALL_AGENT_LABELS.includes(label)), unsupportedLabel]),
    ];
    const preservedHumanActorIds = retainedHumanActorIds(issue, knownAgentLogins);
    const technicalAgentAssignees = technicalAgentLogins(issue, knownAgentLogins);
    const nextActorIds = [...new Set([actor.id, ...preservedHumanActorIds])];

    result.selectedItem = targetRecord;
    result.selectedMode = mode;

    try {
      if (!dryRun) {
        await ensureLabelExists(issue.repository.nameWithOwner, meta.label);
        await replaceIssueLabels(issue.repository.nameWithOwner, issue.number, nextLabels);
        if (isOverride) {
          await replaceAssignableActors(issue.id, nextActorIds);
          await addIssueComment(issue.id, buildOverrideComment(role, issueRef, actor.login));
        } else {
          await assignIssueToAgent(
            issue.id,
            nextActorIds,
            issue.repository.id,
            baseRef,
            buildAgentInstructions(role, issueRef, issue.number, mode),
            model
          );
          await addIssueComment(
            issue.id,
            mode === 'recovery'
              ? buildRecoveryComment(role, issueRef, staleAfterMinutes, issue.updatedAt)
              : buildAssignmentComment(role, issueRef)
          );
        }
        result.executed = true;
      } else {
        result.executed = false;
        result.previewComment = isOverride
          ? buildOverrideComment(role, issueRef, actor.login)
          : mode === 'recovery'
            ? buildRecoveryComment(role, issueRef, staleAfterMinutes, issue.updatedAt)
            : buildAssignmentComment(role, issueRef);
        result.previewInstructions = isOverride
          ? null
          : buildAgentInstructions(role, issueRef, issue.number, mode);
        result.previewLabels = nextLabels;
        result.previewActorIds = nextActorIds;
      }
    } catch (error) {
      if (!dryRun && isCopilotUnavailableError(error)) {
        await ensureLabelExists(issue.repository.nameWithOwner, unsupportedLabel);
        await replaceIssueLabels(issue.repository.nameWithOwner, issue.number, blockedLabels);
        let clearedAgentAssignee = false;
        const cleanupWarnings = [];
        try {
          await replaceAssignableActors(issue.id, preservedHumanActorIds);
          clearedAgentAssignee = true;
        } catch (cleanupError) {
          cleanupWarnings.push(cleanupError.message || String(cleanupError || ''));
        }
        if (technicalAgentAssignees.length > 0) {
          try {
            await removeIssueAssignees(issue.repository.nameWithOwner, issue.number, technicalAgentAssignees);
            clearedAgentAssignee = true;
          } catch (cleanupError) {
            cleanupWarnings.push(cleanupError.message || String(cleanupError || ''));
          }
        }
        if (cleanupWarnings.length > 0) {
          result.assignmentCleanupWarning = cleanupWarnings.join(' | ');
        }
        await addIssueComment(issue.id, buildUnavailableComment(role, issueRef, unsupportedLabel));
        result.assignmentAttempts.push({
          issue: targetRecord.issue,
          status: 'blocked',
          reason: `Repositório sem suporte à atribuição do Copilot cloud agent; issue marcada com ${unsupportedLabel}.`,
          dispatchActorSource: targetRecord.dispatchActorSource,
          cleanupClearedAgentAssignee: clearedAgentAssignee,
        });
        continue;
      }
      throw error;
    }

    result.ok = true;
    result.assignedIssue = issueRef;
    result.assignedAgent = actor.login || preferredAgentLogin;
    result.baseRef = baseRef;
    result.dispatchActorSource = isOverride ? 'overrideAssignee' : targetRecord.dispatchActorSource;
    result.assignmentAttempts.push({
      issue: targetRecord.issue,
      status: dryRun ? 'preview' : mode === 'recovery' ? 'redispatched' : 'assigned',
      reason:
        mode === 'recovery'
          ? 'Primeira execução travada e atribuível encontrada para retomada automática.'
          : 'Primeira task elegível e atribuível encontrada.',
      dispatchActorSource: isOverride ? 'overrideAssignee' : targetRecord.dispatchActorSource,
    });

    const outPath = writeOutputFile(result);
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun,
          role,
          mode,
          assignedIssue: issueRef,
          assignedAgent: actor.login || preferredAgentLogin,
          dispatchActorSource: isOverride ? 'overrideAssignee' : targetRecord.dispatchActorSource,
          outPath,
        },
        null,
        2
      )
    );
    return;
  }

  result.ok = false;
  result.skipped = true;
  result.reason = `Nenhuma task elegível ou execução travada pôde ser atribuída ao agent ${meta.displayName}.`;
  const outPath = writeOutputFile(result);
  console.log(JSON.stringify({ ok: false, skipped: true, reason: result.reason, outPath }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});