const API = 'https://api.github.com/graphql';

const CONFIG = {
  org: process.env.QA_PROJECT_ORG || 'ControleOnline',
  projectNumber: Number(process.env.QA_PROJECT_NUMBER || 1),
  status: process.env.QA_TARGET_STATUS || 'Quality Assurance',
  limit: Number(process.env.QA_TASK_LIMIT || 5),
};

function token() {
  const value = (process.env.TOKEN_PROJECTS || '').trim();
  if (!value) throw new Error('TOKEN_PROJECTS is required');
  return value;
}

async function gql(query, variables = {}) {
  const response = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      'User-Agent': 'github-project-mcp',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(JSON.stringify({ status: response.status, errors: json.errors || json }, null, 2));
  }
  return json.data;
}

function statusOf(item) {
  return item.fieldValues.nodes.find((v) => v?.field?.name === 'Status')?.name || null;
}

async function loadProject() {
  const data = await gql(`
    query($org:String!, $number:Int!) {
      organization(login:$org) {
        projectV2(number:$number) {
          id
          title
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
                  repository { name owner { login } }
                }
                ... on PullRequest {
                  __typename
                  id
                  number
                  title
                  url
                  repository { name owner { login } }
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

async function runBatch() {
  const project = await loadProject();
  const tasks = project.items.nodes
    .filter((item) => item?.content)
    .filter((item) => statusOf(item) === CONFIG.status)
    .slice(0, CONFIG.limit)
    .map((item) => ({
      itemId: item.id,
      type: item.content.__typename,
      repository: `${item.content.repository.owner.login}/${item.content.repository.name}`,
      number: item.content.number,
      title: item.content.title,
      url: item.content.url,
      status: statusOf(item),
    }));

  console.log(JSON.stringify({
    ok: true,
    mode: 'qa-batch',
    project: `${CONFIG.org}/projects/${CONFIG.projectNumber}`,
    status: CONFIG.status,
    limit: CONFIG.limit,
    count: tasks.length,
    tasks,
  }, null, 2));
}

runBatch().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
