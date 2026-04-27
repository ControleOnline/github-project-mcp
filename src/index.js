import fs from 'fs';

const GITHUB_API_URL = 'https://api.github.com/graphql';

function getGithubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim();

  const fallbackPath = process.env.GITHUB_TOKEN_FILE || './githubtoken.key';
  if (fs.existsSync(fallbackPath)) {
    return fs.readFileSync(fallbackPath, 'utf8').trim();
  }

  throw new Error('GitHub token not found. Set GITHUB_TOKEN, GH_TOKEN, or GITHUB_TOKEN_FILE.');
}

async function githubGraphQL(query, variables) {
  const token = getGithubToken();
  const response = await fetch(GITHUB_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'github-project-mcp'
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify({ status: response.status, errors: json.errors || json }, null, 2));
  }

  return json.data;
}

async function getIssueNodeId(owner, repo, issueNumber) {
  const data = await githubGraphQL(
    `query($owner:String!, $repo:String!, $issueNumber:Int!) {
      repository(owner:$owner, name:$repo) {
        issue(number:$issueNumber) {
          id
          number
          title
        }
      }
    }`,
    { owner, repo, issueNumber }
  );

  const issue = data?.repository?.issue;
  if (!issue) throw new Error(`Issue not found: ${owner}/${repo}#${issueNumber}`);
  return issue.id;
}

async function getProjectData(org, projectNumber) {
  const data = await githubGraphQL(
    `query($org:String!, $projectNumber:Int!) {
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
          items(first:100) {
            nodes {
              id
              content {
                ... on Issue {
                  id
                  number
                }
              }
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
            }
          }
        }
      }
    }`,
    { org, projectNumber }
  );

  const project = data?.organization?.projectV2;
  if (!project) throw new Error(`Project not found: org=${org}, number=${projectNumber}`);
  return project;
}

async function updateProjectItemStatus({ org, owner, repo, issueNumber, projectNumber, targetStatus }) {
  const issueId = await getIssueNodeId(owner, repo, issueNumber);
  const project = await getProjectData(org, projectNumber);

  const item = project.items.nodes.find((node) => node?.content?.id === issueId);
  if (!item) {
    throw new Error(`Issue ${owner}/${repo}#${issueNumber} is not in project ${projectNumber}`);
  }

  const statusField = project.fields.nodes.find((field) => field?.name?.toLowerCase() === 'status' && field?.options);
  if (!statusField) {
    throw new Error('Status field not found in the project');
  }

  const targetOption = statusField.options.find(
    (option) => option.name.toLowerCase() === targetStatus.toLowerCase()
  );
  if (!targetOption) {
    throw new Error(`Status option not found: ${targetStatus}`);
  }

  const currentValue = item.fieldValues.nodes.find((value) => value?.field?.name?.toLowerCase() === 'status');
  const previousStatus = currentValue?.name || null;

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
      optionId: targetOption.id
    }
  );

  return {
    ok: true,
    issue: `${owner}/${repo}#${issueNumber}`,
    projectNumber,
    fromStatus: previousStatus,
    toStatus: targetOption.name
  };
}

async function main() {
  const [org, owner, repo, issueNumberRaw, projectNumberRaw, targetStatus = 'In Review'] = process.argv.slice(2);

  if (!org || !owner || !repo || !issueNumberRaw || !projectNumberRaw) {
    console.error('Usage: node src/index.js <org> <owner> <repo> <issue_number> <project_number> [target_status]');
    process.exit(1);
  }

  const result = await updateProjectItemStatus({
    org,
    owner,
    repo,
    issueNumber: Number(issueNumberRaw),
    projectNumber: Number(projectNumberRaw),
    targetStatus
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
