import fs from 'node:fs';

const GRAPHQL_API = 'https://api.github.com/graphql';
const REST_API = 'https://api.github.com';

const CONFIG = {
  org: process.env.QA_PROJECT_ORG || process.env.PROJECT_ORG || 'ControleOnline',
  projectNumber: Number(process.env.QA_PROJECT_NUMBER || process.env.PROJECT_NUMBER || 1),
  status: process.env.DEVOPS_UNTRACKED_STATUS || process.env.QA_UNTRACKED_STATUS || 'Developer',
  repository: process.env.GITHUB_REPOSITORY,
  refName: process.env.GITHUB_REF_NAME,
  sha: process.env.GITHUB_SHA,
  eventPath: process.env.GITHUB_EVENT_PATH,
  repairRefs: (process.env.PROJECT_REPAIR_REFS || '').split(',').map((item) => item.trim()).filter(Boolean),
  repairStatus: process.env.PROJECT_REPAIR_STATUS || 'Developer',
};

function token() {
  const value = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();
  if (!value) throw new Error('GITHUB_TOKEN or GH_TOKEN is required');
  return value;
}

function headers(extra = {}) {
  return {
    Authorization: `Bearer ${token()}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'github-project-mcp',
    ...extra,
  };
}

async function gql(query, variables = {}) {
  const response = await fetch(GRAPHQL_API, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify({ status: response.status, errors: json.errors || json }, null, 2));
  }
  return json.data;
}

async function rest(path, options = {}) {
  const response = await fetch(`${REST_API}${path}`, {
    ...options,
    headers: headers({ 'Content-Type': 'application/json', ...(options.headers || {}) }),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(JSON.stringify({ status: response.status, path, body }, null, 2));
  }
  return body;
}

async function loadProject() {
  const data = await gql(`
    query($org:String!, $number:Int!) {
      organization(login:$org) {
        projectV2(number:$number) {
          id
          fields(first:50) {
            nodes {
              ... on ProjectV2FieldCommon { id name }
              ... on ProjectV2SingleSelectField { id name options { id name } }
            }
          }
        }
      }
    }
  `, { org: CONFIG.org, number: CONFIG.projectNumber });
  const project = data?.organization?.projectV2;
  if (!project) throw new Error(`Project not found: ${CONFIG.org}/projects/${CONFIG.projectNumber}`);
  return project;
}

async function loadProjectItems() {
  const data = await gql(`
    query($org:String!, $number:Int!) {
      organization(login:$org) {
        projectV2(number:$number) {
          id
          fields(first:50) {
            nodes {
              ... on ProjectV2FieldCommon { id name }
              ... on ProjectV2SingleSelectField { id name options { id name } }
            }
          }
          items(first:100) {
            nodes {
              id
              content {
                ... on Issue {
                  __typename
                  id
                  number
                  title
                  url
                  repository { nameWithOwner }
                }
                ... on PullRequest {
                  __typename
                  id
                  number
                  title
                  url
                  repository { nameWithOwner }
                }
              }
              fieldValues(first:30) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field { ... on ProjectV2SingleSelectField { name } }
                  }
                }
              }
            }
          }
        }
      }
    }
  `, { org: CONFIG.org, number: CONFIG.projectNumber });
  const project = data?.organization?.projectV2;
  if (!project) throw new Error(`Project not found: ${CONFIG.org}/projects/${CONFIG.projectNumber}`);
  return project;
}

function statusField(project) {
  const field = project.fields.nodes.find((f) => f?.name === 'Status' && f?.options);
  if (!field) throw new Error('Status field not found');
  return field;
}

function statusOf(item) {
  return item.fieldValues?.nodes?.find((value) => value?.field?.name === 'Status')?.name || null;
}

function itemRef(item) {
  const content = item.content;
  if (!content?.repository?.nameWithOwner || !content?.number) return null;
  return `${content.repository.nameWithOwner}#${content.number}`;
}

async function addIssueToProject(project, issueNodeId) {
  const data = await gql(`
    mutation($projectId:ID!, $contentId:ID!) {
      addProjectV2ItemById(input:{ projectId:$projectId, contentId:$contentId }) {
        item { id }
      }
    }
  `, { projectId: project.id, contentId: issueNodeId });
  return data.addProjectV2ItemById.item.id;
}

async function moveProjectItem(project, itemId, targetStatus) {
  const field = statusField(project);
  const option = field.options.find((o) => o.name.toLowerCase() === targetStatus.toLowerCase());
  if (!option) throw new Error(`Status option not found: ${targetStatus}`);
  await gql(`
    mutation($projectId:ID!, $itemId:ID!, $fieldId:ID!, $optionId:String!) {
      updateProjectV2ItemFieldValue(input:{
        projectId:$projectId,
        itemId:$itemId,
        fieldId:$fieldId,
        value:{ singleSelectOptionId:$optionId }
      }) { projectV2Item { id } }
    }
  `, { projectId: project.id, itemId, fieldId: field.id, optionId: option.id });
}

async function repairConfiguredProjectItems() {
  if (CONFIG.repairRefs.length === 0) return [];
  const wanted = new Set(CONFIG.repairRefs.map((ref) => ref.toLowerCase()));
  const project = await loadProjectItems();
  const repairs = [];

  for (const item of project.items.nodes || []) {
    const ref = itemRef(item);
    if (!ref || !wanted.has(ref.toLowerCase())) continue;
    const currentStatus = statusOf(item);
    if (currentStatus?.toLowerCase() === CONFIG.repairStatus.toLowerCase()) {
      repairs.push({ ref, status: currentStatus, changed: false });
      continue;
    }
    await moveProjectItem(project, item.id, CONFIG.repairStatus);
    repairs.push({ ref, from: currentStatus, to: CONFIG.repairStatus, changed: true });
  }

  return repairs;
}

function readEvent() {
  if (!CONFIG.eventPath) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG.eventPath, 'utf8'));
  } catch {
    return null;
  }
}

function hasTaskReference(event) {
  if (/^task-\d+$/i.test(CONFIG.refName || '')) return true;
  const text = JSON.stringify(event || {});
  return /(?:#\d+|task-\d+|close[sd]?\s+#\d+|fix(?:e[sd])?\s+#\d+|ref(?:s|erences)?\s+#\d+)/i.test(text);
}

async function createTrackingIssue(event) {
  const commits = event?.commits || [];
  const body = [
    'Automação DevOps detectou alteração sem tarefa vinculada.',
    '',
    `Repositório: ${CONFIG.repository}`,
    `Branch original: ${CONFIG.refName}`,
    `SHA: ${CONFIG.sha}`,
    '',
    'Resumo dos commits:',
    ...commits.slice(0, 20).map((commit) => `- ${commit.id?.slice(0, 12) || ''} ${commit.message?.split('\n')[0] || ''}`),
    '',
    'Fluxo obrigatório:',
    '1. Continuar a partir do branch criado pela automação: `task-{id}`.',
    '2. Abrir PR vinculado a esta tarefa.',
    '3. Seguir o fluxo normal pelo ProjectV2, começando em `Developer`.',
  ].join('\n');

  return rest(`/repos/${CONFIG.repository}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title: `DevOps: mudança sem tarefa em ${CONFIG.refName}`,
      body,
      labels: ['devops', 'untracked-change'],
    }),
  });
}

async function createTaskBranch(issueNumber) {
  const branch = `task-${issueNumber}`;
  try {
    await rest(`/repos/${CONFIG.repository}/git/ref/heads/${encodeURIComponent(branch)}`);
    return { branch, created: false };
  } catch {
    await rest(`/repos/${CONFIG.repository}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: CONFIG.sha }),
    });
    return { branch, created: true };
  }
}

async function main() {
  if (!CONFIG.repository || !CONFIG.refName || !CONFIG.sha) {
    throw new Error('GITHUB_REPOSITORY, GITHUB_REF_NAME and GITHUB_SHA are required');
  }

  const event = readEvent();
  const repairs = await repairConfiguredProjectItems();
  if (hasTaskReference(event)) {
    console.log(JSON.stringify({ ok: true, skipped: true, reason: 'Task reference already present.', repairs }, null, 2));
    return;
  }

  const project = await loadProject();
  const issue = await createTrackingIssue(event);
  const itemId = await addIssueToProject(project, issue.node_id);
  await moveProjectItem(project, itemId, CONFIG.status);
  const branch = await createTaskBranch(issue.number);

  await rest(`/repos/${CONFIG.repository}/issues/${issue.number}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      body: `Branch de continuidade criado: \`${branch.branch}\`. Todo desenvolvimento subsequente deve sair desse branch e seguir por PR vinculado a esta tarefa.`,
    }),
  });

  console.log(JSON.stringify({
    ok: true,
    issue: issue.html_url,
    branch: branch.branch,
    branchCreated: branch.created,
    project: `${CONFIG.org}/projects/${CONFIG.projectNumber}`,
    status: CONFIG.status,
    repairs,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
