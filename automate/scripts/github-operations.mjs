import fs from 'node:fs';
import { githubRetryConfig, isRetriableGraphQLErrors, isRetriableStatus, retryAsync, retryableError } from '../../src/retry.js';

const GRAPHQL_URL = 'https://api.github.com/graphql';
const REST_URL = 'https://api.github.com';
const RETRY = githubRetryConfig('GITHUB_OPS');
const DEFAULT_ALLOWED_LOGINS = 'luizkim,github-copilot[bot],copilot-swe-agent,copilot';

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function parseCsv(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function token() {
  return env('GH_TOKEN') || env('GITHUB_TOKEN');
}

function requiredToken() {
  const value = token();
  if (!value) throw new Error('Missing GitHub token. Set GH_TOKEN or GITHUB_TOKEN.');
  return value;
}

async function githubGraphQL(query, variables = {}) {
  const auth = requiredToken();
  return retryAsync(
    async () => {
      let response;
      try {
        response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth}`,
            'User-Agent': 'controleonline-github-operations'
          },
          body: JSON.stringify({ query, variables })
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
        if (isRetriableStatus(response.status)) throw retryableError(message);
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
    { label: 'GitHub Ops GraphQL', ...RETRY }
  );
}

async function githubRest(path, options = {}) {
  const auth = requiredToken();
  return retryAsync(
    async () => {
      let response;
      try {
        response = await fetch(`${REST_URL}${path}`, {
          ...options,
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${auth}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            'User-Agent': 'controleonline-github-operations',
            ...(options.headers || {})
          }
        });
      } catch (error) {
        throw retryableError(`GitHub REST request failed: ${error.message || error}`);
      }

      const text = await response.text();
      let json;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        const message = JSON.stringify({ status: response.status, path, body: text }, null, 2);
        if (isRetriableStatus(response.status)) throw retryableError(message);
        throw new Error(message);
      }

      if (!response.ok) {
        const message = JSON.stringify({ status: response.status, path, body: json }, null, 2);
        if (isRetriableStatus(response.status)) throw retryableError(message);
        throw new Error(message);
      }

      return json;
    },
    { label: `GitHub Ops REST ${path}`, ...RETRY }
  );
}

function extractJsonBlock(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const raw = text.replace(/^\/github-ops\s*/i, '').trim();
  return raw;
}

function readIssueCommentCommand() {
  const eventName = env('GITHUB_EVENT_NAME');
  const eventPath = env('GITHUB_EVENT_PATH');
  if (eventName !== 'issue_comment' || !eventPath || !fs.existsSync(eventPath)) {
    return { ignored: false, payload: null, source: 'env' };
  }

  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const body = event.comment?.body || '';
  if (!body.trim().toLowerCase().startsWith('/github-ops')) {
    return { ignored: true, payload: null, source: 'issue_comment' };
  }

  const allowed = new Set(parseCsv(env('GITHUB_OPS_ALLOWED_LOGINS', DEFAULT_ALLOWED_LOGINS)).map((login) => login.toLowerCase()));
  const actor = (event.comment?.user?.login || '').toLowerCase();
  if (allowed.size > 0 && !allowed.has(actor)) {
    throw new Error(`Actor not allowed to run /github-ops: ${actor || 'unknown'}`);
  }

  const jsonText = extractJsonBlock(body);
  if (!jsonText) {
    throw new Error('Missing JSON payload after /github-ops command.');
  }

  const payload = JSON.parse(jsonText);
  return {
    ignored: false,
    payload,
    source: `issue_comment:${event.repository?.full_name || 'unknown'}#${event.issue?.number || 'unknown'}`,
    actor
  };
}

function readOperationsPayload() {
  const inline = env('OPERATIONS_JSON');
  if (inline) {
    return { payload: JSON.parse(inline), source: 'OPERATIONS_JSON' };
  }

  const fromComment = readIssueCommentCommand();
  if (fromComment.ignored) {
    return { payload: null, source: fromComment.source, ignored: true };
  }
  if (fromComment.payload) {
    return fromComment;
  }

  return { payload: null, source: 'none' };
}

async function getProjectMetadata(org, projectNumber) {
  const query = `query($org:String!, $projectNumber:Int!, $cursor:String) {
    organization(login:$org) {
      projectV2(number:$projectNumber) {
        id
        title
        fields(first:50) {
          nodes {
            ... on ProjectV2FieldCommon {
              id
              name
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
        items(first:100, after:$cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            content {
              ... on Issue {
                id
                number
                repository {
                  nameWithOwner
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
  if (!project) {
    throw new Error(`Project not found: ${org}#${projectNumber}`);
  }

  const items = [...(project.items?.nodes || [])];
  let pageInfo = project.items?.pageInfo;
  while (pageInfo?.hasNextPage && pageInfo.endCursor) {
    const page = await githubGraphQL(query, { org, projectNumber, cursor: pageInfo.endCursor });
    items.push(...(page?.organization?.projectV2?.items?.nodes || []));
    pageInfo = page?.organization?.projectV2?.items?.pageInfo;
  }
  project.items.nodes = items;
  return project;
}

function splitRepo(fullName) {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) throw new Error(`Invalid repo_full_name: ${fullName}`);
  return { owner, repo };
}

function getStatusField(project) {
  const field = (project.fields?.nodes || []).find(
    (entry) => entry?.name?.toLowerCase() === 'status' && entry?.options
  );
  if (!field) throw new Error('Status field not found in project.');
  return field;
}

function getStatusOption(field, targetStatus) {
  const option = (field.options || []).find(
    (entry) => entry?.name?.toLowerCase() === String(targetStatus).toLowerCase()
  );
  if (!option) throw new Error(`Project status option not found: ${targetStatus}`);
  return option;
}

function getProjectItem(project, repoFullName, issueNumber, itemId) {
  if (itemId) {
    const item = (project.items?.nodes || []).find((entry) => entry.id === itemId);
    if (!item) throw new Error(`Project item not found by item_id: ${itemId}`);
    return item;
  }

  const item = (project.items?.nodes || []).find((entry) => {
    return entry?.content?.repository?.nameWithOwner === repoFullName && entry?.content?.number === Number(issueNumber);
  });
  if (!item) throw new Error(`Project item not found for ${repoFullName}#${issueNumber}`);
  return item;
}

async function updateProjectStatus(input) {
  const project = await getProjectMetadata(input.org, Number(input.project_number));
  const statusField = getStatusField(project);
  const statusOption = getStatusOption(statusField, input.target_status);
  const item = getProjectItem(project, input.repo_full_name, input.issue_number, input.item_id);

  await githubGraphQL(
    `mutation($projectId:ID!, $itemId:ID!, $fieldId:ID!, $optionId:String!) {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { singleSelectOptionId: $optionId }
        }
      ) {
        projectV2Item {
          id
        }
      }
    }`,
    {
      projectId: project.id,
      itemId: item.id,
      fieldId: statusField.id,
      optionId: statusOption.id
    }
  );

  return {
    project: { id: project.id, title: project.title, org: input.org, number: Number(input.project_number) },
    item_id: item.id,
    target_status: input.target_status,
    repo_full_name: input.repo_full_name || item?.content?.repository?.nameWithOwner || null,
    issue_number: input.issue_number || item?.content?.number || null
  };
}

async function addIssueComment(input) {
  const { owner, repo } = splitRepo(input.repo_full_name);
  const body = await githubRest(`/repos/${owner}/${repo}/issues/${Number(input.issue_number)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: input.body })
  });
  return { comment_id: body?.id || null, html_url: body?.html_url || null };
}

async function replaceLabels(input) {
  const { owner, repo } = splitRepo(input.repo_full_name);
  const body = await githubRest(`/repos/${owner}/${repo}/issues/${Number(input.issue_number)}/labels`, {
    method: 'PUT',
    body: JSON.stringify(input.labels || [])
  });
  return { labels: (body || []).map((label) => label?.name).filter(Boolean) };
}

async function addAssignees(input) {
  const { owner, repo } = splitRepo(input.repo_full_name);
  const body = await githubRest(`/repos/${owner}/${repo}/issues/${Number(input.issue_number)}/assignees`, {
    method: 'POST',
    body: JSON.stringify({ assignees: input.assignees || [] })
  });
  return { assignees: (body?.assignees || []).map((entry) => entry?.login).filter(Boolean) };
}

async function removeAssignees(input) {
  const { owner, repo } = splitRepo(input.repo_full_name);
  const body = await githubRest(`/repos/${owner}/${repo}/issues/${Number(input.issue_number)}/assignees`, {
    method: 'DELETE',
    body: JSON.stringify({ assignees: input.assignees || [] })
  });
  return { assignees: (body?.assignees || []).map((entry) => entry?.login).filter(Boolean) };
}

async function addPrReview(input) {
  const query = `query($owner:String!, $repo:String!, $number:Int!) {
    repository(owner:$owner, name:$repo) {
      pullRequest(number:$number) {
        id
      }
    }
  }`;
  const { owner, repo } = splitRepo(input.repo_full_name);
  const data = await githubGraphQL(query, { owner, repo, number: Number(input.pull_number) });
  const prId = data?.repository?.pullRequest?.id;
  if (!prId) throw new Error(`Pull request not found: ${input.repo_full_name}#${input.pull_number}`);

  const result = await githubGraphQL(
    `mutation($pullRequestId:ID!, $event:PullRequestReviewEvent!, $body:String!) {
      addPullRequestReview(input:{pullRequestId:$pullRequestId, event:$event, body:$body}) {
        pullRequestReview {
          id
          state
        }
      }
    }`,
    { pullRequestId: prId, event: input.event, body: input.body || '' }
  );
  return result?.addPullRequestReview?.pullRequestReview || null;
}

async function executeOperation(operation) {
  const type = String(operation.type || '').trim();
  if (!type) throw new Error('Operation is missing type.');

  switch (type) {
    case 'project_status':
      return updateProjectStatus(operation);
    case 'issue_comment':
      return addIssueComment(operation);
    case 'replace_labels':
      return replaceLabels(operation);
    case 'add_assignees':
      return addAssignees(operation);
    case 'remove_assignees':
      return removeAssignees(operation);
    case 'pr_review':
      return addPrReview(operation);
    case 'rest':
      return githubRest(operation.path, {
        method: operation.method || 'GET',
        body: operation.body !== undefined ? JSON.stringify(operation.body) : undefined,
        headers: operation.headers || {}
      });
    case 'graphql':
      return githubGraphQL(operation.query, operation.variables || {});
    default:
      throw new Error(`Unsupported operation type: ${type}`);
  }
}

function writeOutput(payload) {
  const outDir = env('GITHUB_OPS_OUTPUT_DIR', '/tmp');
  const outPath = `${outDir}/github-operations.json`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  return outPath;
}

async function main() {
  const loaded = readOperationsPayload();
  if (loaded.ignored) {
    console.log(JSON.stringify({ ok: true, ignored: true, source: loaded.source }, null, 2));
    return;
  }

  const payload = loaded.payload || {};
  const dryRun = payload.dry_run === true || env('GITHUB_OPS_DRY_RUN', 'false').toLowerCase() === 'true';
  const operations = Array.isArray(payload.operations) ? payload.operations : [];
  if (operations.length === 0) {
    throw new Error('No operations provided.');
  }

  const results = [];
  for (const operation of operations) {
    const record = { type: operation.type, input: operation };
    if (dryRun) {
      record.dry_run = true;
      results.push(record);
      continue;
    }
    try {
      record.result = await executeOperation(operation);
      record.ok = true;
    } catch (error) {
      record.ok = false;
      record.error = error.message || String(error);
    }
    results.push(record);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    source: loaded.source,
    dryRun,
    operationCount: operations.length,
    successCount: results.filter((entry) => entry.ok !== false).length,
    failureCount: results.filter((entry) => entry.ok === false).length,
    results
  };
  const outPath = writeOutput(summary);
  console.log(JSON.stringify({ ok: summary.failureCount === 0, outPath, dryRun, operationCount: operations.length, failureCount: summary.failureCount }, null, 2));
  if (summary.failureCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
