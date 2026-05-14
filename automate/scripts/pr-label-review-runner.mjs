import fs from 'node:fs';
import {
  githubRetryConfig,
  isRetriableGraphQLErrors,
  isRetriableStatus,
  retryAsync,
  retryableError,
} from '../../src/retry.js';

const GRAPHQL_URL = 'https://api.github.com/graphql';
const REST_URL = 'https://api.github.com';
const RETRY = githubRetryConfig('PR_LABEL_REVIEW');
const DEFAULT_ALLOWED_AUTHOR_ASSOCIATIONS = 'OWNER,MEMBER,COLLABORATOR';
const DEFAULT_STAGING_BRANCH = 'staging';
const DEFAULT_BLOCKED_HEAD_BRANCHES = 'master,main,staging';

const REVIEWER_META = {
  qa: {
    displayName: 'QA',
    acceptedLabel: 'qa:accepted',
    rejectedLabel: 'qa:rejected',
  },
  security: {
    displayName: 'Security',
    acceptedLabel: 'security:accepted',
    rejectedLabel: 'security:rejected',
  },
};

const ALL_REVIEW_LABELS = [
  REVIEWER_META.qa.acceptedLabel,
  REVIEWER_META.qa.rejectedLabel,
  REVIEWER_META.security.acceptedLabel,
  REVIEWER_META.security.rejectedLabel,
];

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function parseCsv(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getToken() {
  return env('GITHUB_TOKEN') || env('GH_TOKEN');
}

function getRole() {
  const role = env('PR_REVIEW_ROLE');
  if (!REVIEWER_META[role]) throw new Error(`Unsupported PR_REVIEW_ROLE: ${role}`);
  return role;
}

async function githubGraphQL(query, variables = {}) {
  const token = getToken();
  if (!token) throw new Error('Missing GitHub token. Set GITHUB_TOKEN or GH_TOKEN.');

  return retryAsync(
    async () => {
      let response;
      try {
        response = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'controleonline-pr-label-review',
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
    { label: 'GitHub GraphQL PR label review', ...RETRY }
  );
}

async function githubRest(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error('Missing GitHub token. Set GITHUB_TOKEN or GH_TOKEN.');

  return retryAsync(
    async () => {
      let response;
      try {
        response = await fetch(`${REST_URL}${path}`, {
          ...options,
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            'User-Agent': 'controleonline-pr-label-review',
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
        if (isRetriableStatus(response.status)) throw retryableError(message);
        throw new Error(message);
      }

      if (!response.ok) {
        const message = JSON.stringify({ status: response.status, path, body }, null, 2);
        if (isRetriableStatus(response.status)) throw retryableError(message);
        throw new Error(message);
      }

      return body;
    },
    { label: `GitHub REST PR label review ${path}`, ...RETRY }
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
            content {
              ... on Issue {
                id
                number
                title
                url
                state
                createdAt
                updatedAt
                authorAssociation
                author {
                  login
                }
                repository {
                  nameWithOwner
                }
                timelineItems(first:50, itemTypes:[CROSS_REFERENCED_EVENT]) {
                  nodes {
                    ... on CrossReferencedEvent {
                      source {
                        __typename
                        ... on PullRequest {
                          id
                          number
                          title
                          url
                          state
                          isDraft
                          mergeable
                          baseRefName
                          headRefName
                          labels(first:20) {
                            nodes {
                              name
                            }
                          }
                          repository {
                            nameWithOwner
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
    items.push(...(page?.organization?.projectV2?.items?.nodes || []));
    pageInfo = page?.organization?.projectV2?.items?.pageInfo;
  }

  project.items.nodes = items;
  return firstPage;
}

function authorIsEligible(issue, allowedAssociations) {
  return allowedAssociations.has((issue.authorAssociation || '').toUpperCase());
}

function normalizePullRequests(issue) {
  const seen = new Set();
  const pullRequests = [];
  for (const node of issue.timelineItems?.nodes || []) {
    const pr = node?.source;
    if (!pr || pr.__typename !== 'PullRequest') continue;
    const key = `${pr.repository?.nameWithOwner || ''}#${pr.number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pullRequests.push(pr);
  }
  return pullRequests;
}

function pullRequestLabels(pr) {
  return (pr.labels?.nodes || []).map((label) => label?.name).filter(Boolean);
}

function isOpenPullRequest(pr) {
  return pr?.state === 'OPEN';
}

function hasLabel(pr, label) {
  return pullRequestLabels(pr).includes(label);
}

function hasAnyRejectedLabel(pr) {
  return hasLabel(pr, REVIEWER_META.qa.rejectedLabel) || hasLabel(pr, REVIEWER_META.security.rejectedLabel);
}

function branchContainsIssueNumber(headRefName, issueNumber) {
  const escaped = String(issueNumber).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|[/-])${escaped}([/-]|$)`);
  return pattern.test(headRefName || '');
}

function evaluatePullRequest(item, pr, meta, stagingBranch, blockedHeadBranches) {
  const issue = item.content;
  const reasons = [];

  if (pr.isDraft) {
    reasons.push('o PR ainda esta em draft');
  }

  if ((pr.baseRefName || '').trim().toLowerCase() !== stagingBranch.toLowerCase()) {
    reasons.push(`o PR precisa apontar para ${stagingBranch}`);
  }

  if (!branchContainsIssueNumber(pr.headRefName || '', issue.number)) {
    reasons.push(`a branch do developer precisa conter o numero da issue ${issue.number}`);
  }

  if (blockedHeadBranches.has((pr.headRefName || '').trim().toLowerCase())) {
    reasons.push(`o developer nao pode trabalhar diretamente na branch ${pr.headRefName}`);
  }

  if (pr.mergeable === false || pr.mergeable === 'CONFLICTING') {
    reasons.push('o PR esta com conflito de merge');
  }

  if (reasons.length > 0) {
    return {
      result: 'rejected',
      reasons,
      targetLabel: meta.rejectedLabel,
    };
  }

  return {
    result: 'accepted',
    reasons: [
      `o PR esta aberto e pronto para a analise de ${meta.displayName}`,
      `a base do PR esta em ${stagingBranch}`,
      `a branch inclui o numero da issue ${issue.number}`,
    ],
    targetLabel: meta.acceptedLabel,
  };
}

function buildIssueComment(issueRef, prRef, meta, reasons) {
  return [
    `### ${meta.displayName} recusou o PR`,
    '',
    `Issue: ${issueRef}`,
    `PR: ${prRef}`,
    '',
    'Motivos objetivos:',
    ...reasons.map((reason) => `- ${reason}`),
    '',
    'Ajuste a implementacao na branch da issue e publique uma nova PR para staging.',
  ].join('\n');
}

function sortByIssueCreatedAt(items) {
  return [...items].sort((left, right) => {
    const leftTs = Date.parse(left.content?.createdAt || '') || 0;
    const rightTs = Date.parse(right.content?.createdAt || '') || 0;
    return leftTs - rightTs;
  });
}

function serializeCandidate(item, pr) {
  const issue = item.content;
  return {
    issue: {
      id: issue.id,
      ref: `${issue.repository.nameWithOwner}#${issue.number}`,
      title: issue.title,
      url: issue.url,
      state: issue.state,
      createdAt: issue.createdAt,
      authorLogin: issue.author?.login || null,
      authorAssociation: issue.authorAssociation || null,
    },
    pullRequest: {
      id: pr.id,
      ref: `${pr.repository?.nameWithOwner || 'unknown'}#${pr.number}`,
      title: pr.title,
      url: pr.url,
      state: pr.state,
      isDraft: Boolean(pr.isDraft),
      mergeable: pr.mergeable,
      baseRefName: pr.baseRefName || null,
      headRefName: pr.headRefName || null,
      labels: pullRequestLabels(pr),
    },
  };
}

function findCandidate(items, meta, allowedAssociations) {
  for (const item of sortByIssueCreatedAt(items)) {
    const issue = item.content;
    if (!issue?.repository?.nameWithOwner) continue;
    if (issue.state !== 'OPEN') continue;
    if (!authorIsEligible(issue, allowedAssociations)) continue;

    const pullRequests = normalizePullRequests(issue)
      .filter((pr) => isOpenPullRequest(pr))
      .filter((pr) => !hasAnyRejectedLabel(pr));

    for (const pr of pullRequests) {
      if (hasLabel(pr, meta.acceptedLabel) || hasLabel(pr, meta.rejectedLabel)) continue;
      return { item, pr };
    }
  }

  return null;
}

async function replacePullRequestLabels(repoFullName, pullNumber, labels) {
  const [owner, repo] = repoFullName.split('/');
  await githubRest(`/repos/${owner}/${repo}/issues/${pullNumber}/labels`, {
    method: 'PUT',
    body: JSON.stringify(labels),
  });
}

async function addIssueComment(repoFullName, issueNumber, body) {
  const [owner, repo] = repoFullName.split('/');
  await githubRest(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

function writeOutputFile(payload, role) {
  const outDir = env(`${role.toUpperCase()}_OUTPUT_DIR`, env('AGENT_OUTPUT_DIR', '/tmp'));
  const outPath = `${outDir}/${role}-pr-review.json`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  return outPath;
}

async function main() {
  const role = getRole();
  const meta = REVIEWER_META[role];
  const org = env('AGENT_PROJECT_ORG', 'ControleOnline');
  const projectNumber = Number(env('AGENT_PROJECT_NUMBER', '1'));
  const dryRun = env(`${role.toUpperCase()}_DRY_RUN`, env('AGENT_DRY_RUN', 'true')).toLowerCase() !== 'false';
  const allowedAssociations = new Set(
    parseCsv(env('REVIEW_ALLOWED_AUTHOR_ASSOCIATIONS', DEFAULT_ALLOWED_AUTHOR_ASSOCIATIONS)).map((value) =>
      value.toUpperCase()
    )
  );
  const stagingBranch = env('REVIEW_STAGING_BRANCH', DEFAULT_STAGING_BRANCH);
  const blockedHeadBranches = new Set(
    parseCsv(env('REVIEW_BLOCKED_HEAD_BRANCHES', DEFAULT_BLOCKED_HEAD_BRANCHES)).map((value) => value.toLowerCase())
  );

  const data = await getProjectSnapshot(org, projectNumber);
  const project = data?.organization?.projectV2;
  if (!project) throw new Error(`Project not found: ${org}/projects/${projectNumber}`);

  const items = project.items?.nodes || [];
  const candidate = findCandidate(items, meta, allowedAssociations);

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
    allowedAuthorAssociations: Array.from(allowedAssociations),
    stagingBranch,
    blockedHeadBranches: Array.from(blockedHeadBranches),
    candidate: candidate ? serializeCandidate(candidate.item, candidate.pr) : null,
  };

  if (!candidate) {
    result.ok = true;
    result.skipped = true;
    result.reason = `Nenhum PR aberto de developer pendente de ${meta.displayName} foi encontrado.`;
    const outPath = writeOutputFile(result, role);
    console.log(JSON.stringify({ ok: true, skipped: true, reason: result.reason, outPath }, null, 2));
    return;
  }

  const decision = evaluatePullRequest(candidate.item, candidate.pr, meta, stagingBranch, blockedHeadBranches);
  const repoFullName = candidate.pr.repository?.nameWithOwner || candidate.item.content.repository.nameWithOwner;
  const currentLabels = pullRequestLabels(candidate.pr).filter(
    (label) => label !== meta.acceptedLabel && label !== meta.rejectedLabel
  );
  const nextLabels = [...currentLabels, decision.targetLabel];
  result.decision = {
    result: decision.result,
    reasons: decision.reasons,
    targetLabel: decision.targetLabel,
    nextLabels,
  };

  if (!dryRun) {
    await replacePullRequestLabels(repoFullName, candidate.pr.number, nextLabels);
    if (decision.result === 'rejected') {
      await addIssueComment(
        candidate.item.content.repository.nameWithOwner,
        candidate.item.content.number,
        buildIssueComment(
          `${candidate.item.content.repository.nameWithOwner}#${candidate.item.content.number}`,
          `${repoFullName}#${candidate.pr.number}`,
          meta,
          decision.reasons
        )
      );
    }
  }

  result.ok = true;
  result.reason = `${meta.displayName} registrou ${decision.result === 'accepted' ? 'aceite' : 'recusa'} por label no PR.`;
  const outPath = writeOutputFile(result, role);
  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        role,
        issue: result.candidate.issue.ref,
        pullRequest: result.candidate.pullRequest.ref,
        decision: decision.result,
        outPath,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});