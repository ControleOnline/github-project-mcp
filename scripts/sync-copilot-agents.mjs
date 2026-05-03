import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ctoRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.dirname(ctoRoot);

const CONTROL_OWNER = "ControleOnline";
const CTO_REPO = "cto-mcp";
const CTO_BASE_URL = `https://github.com/${CONTROL_OWNER}/${CTO_REPO}/blob/master`;
const types = ["developer", "qa", "security", "devops"];

const typeMeta = {
  developer: {
    displayName: "Developer",
    descriptionPrefix: "Executor autônomo de issues",
  },
  qa: {
    displayName: "Quality Assurance",
    descriptionPrefix: "Revisor técnico de entregas",
  },
  security: {
    displayName: "Security",
    descriptionPrefix: "Revisor de segurança",
  },
  devops: {
    displayName: "DevOps",
    descriptionPrefix: "Operador de fluxo e automações",
  },
};

const roots = [
  { key: "cto-mcp", relPath: "cto-mcp", family: "automation" },
  { key: "api-community", relPath: "api-community", family: "backend" },
  { key: "api-whatsapp", relPath: "api-whatsapp", family: "integration" },
  { key: "app-community", relPath: "app-community", family: "frontend" },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readFileIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
}

function git(repoPath, args, fallback = "") {
  try {
    return execFileSync("git", ["-C", repoPath, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

function parseControleRepoName(remoteUrl) {
  const normalized = remoteUrl.replace(/^git@github\.com:/, "https://github.com/");
  const match = normalized.match(/github\.com\/ControleOnline\/([^/]+?)(?:\.git)?$/);
  return match ? match[1] : null;
}

function normalizeRemoteUrl(remoteUrl, repoName) {
  if (!remoteUrl) {
    return `https://github.com/${CONTROL_OWNER}/${repoName}.git`;
  }
  if (remoteUrl.startsWith("git@github.com:")) {
    return remoteUrl.replace(/^git@github\.com:/, "https://github.com/");
  }
  return remoteUrl;
}

function parseGitmodules(rootPath) {
  const filePath = path.join(rootPath, ".gitmodules");
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const entries = [];
  let current = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^\[submodule "(.+)"\]$/);
    if (sectionMatch) {
      if (current) {
        entries.push(current);
      }
      current = { section: sectionMatch[1] };
      continue;
    }

    const kvMatch = line.match(/^\s*([a-z]+)\s*=\s*(.+)\s*$/);
    if (current && kvMatch) {
      current[kvMatch[1]] = kvMatch[2];
    }
  }

  if (current) {
    entries.push(current);
  }

  return entries.filter((entry) => entry.path && entry.url);
}

function detectReviewTarget() {
  return "dev";
}

function detectDefaultBranch(repoPath, declaredBranch) {
  return "master";
}

function detectFamily(rootKey, repoName) {
  if (rootKey === "cto-mcp") {
    return "automation";
  }
  if (rootKey === "app-community" || repoName.startsWith("ui-")) {
    return "frontend";
  }
  if (
    rootKey === "api-whatsapp" ||
    repoName.includes("whatsapp") ||
    repoName.includes("messages-sdk") ||
    repoName.includes("spc-sdk")
  ) {
    return "integration";
  }
  return "backend";
}

function repoKindLabel(entry) {
  return entry.kind === "root" ? "projeto raiz" : `submódulo de ${entry.rootKey}`;
}

function familyLabel(family) {
  switch (family) {
    case "frontend":
      return "frontend";
    case "backend":
      return "backend";
    case "integration":
      return "integração";
    case "automation":
      return "automação";
    default:
      return family;
  }
}

function relativeToWorkspace(targetPath) {
  return path.relative(workspaceRoot, targetPath).replace(/\\/g, "/");
}

function renderWrapper(type, entry) {
  const meta = typeMeta[type];
  const centralAgentUrl = `${CTO_BASE_URL}/agents/agent/${type}/agent.md`;
  const agentsStatus = entry.hasAgentsMd ? "presente" : "ausente";

  return `---
name: ${meta.displayName}
description: ${meta.descriptionPrefix} do repositório ${CONTROL_OWNER}/${entry.repoName}, com fonte canônica centralizada no cto-mcp.
target: github-copilot
---

## Fonte canônica

Este wrapper é intencionalmente fino. Antes de agir, leia e siga, nesta ordem:

1. \`${centralAgentUrl}\`

Esse arquivo central referencia as regras-base de \`automation/\` no \`cto-mcp\`. Se este wrapper local divergir do conteúdo canônico do \`cto-mcp\`, prefira o \`cto-mcp\`, salvo quando o estado real deste repositório exigir adaptação operacional explícita.

## Contexto local

Você está operando no repositório \`${CONTROL_OWNER}/${entry.repoName}\`.

Você conhece o ecossistema completo da ControleOnline. Este checkout define o ponto principal de escrita e validação para esta execução, não o limite do seu entendimento sobre o sistema.

- Checkout local: \`${entry.workspacePath}\`
- Tipo: ${repoKindLabel(entry)}
- Família: ${familyLabel(entry.family)}
- Branch base operacional: \`${entry.baseBranch}\`
- Alvo preferencial de PR: \`${entry.reviewTarget}\`
- \`AGENTS.md\` local: ${agentsStatus}

Leia o \`AGENTS.md\` mais próximo antes de editar código. Se esta alteração tocar apenas o repositório atual, trabalhe aqui; se também exigir atualização do superprojeto que consome este repositório, registre ou entregue a composição necessária sem perder a separação de ownership.

_Arquivo gerado por \`cto-mcp/scripts/sync-copilot-agents.mjs\`._
`;
}

function collectEntries() {
  const entries = [];
  const byLocalPath = new Map();

  function addEntry(raw) {
    const localPath = path.join(workspaceRoot, raw.localRelPath);
    const existsLocally = fs.existsSync(localPath);
    const remoteUrl = raw.remoteUrl || (existsLocally ? git(localPath, ["remote", "get-url", "origin"]) : "");
    const repoName = parseControleRepoName(remoteUrl);

    if (!repoName) {
      return;
    }

    const resolvedRemote = normalizeRemoteUrl(remoteUrl, repoName);
    const baseBranch = detectDefaultBranch(existsLocally ? localPath : "", raw.declaredBranch);
    const reviewTarget = existsLocally ? detectReviewTarget(localPath) : "dev";
    const hasAgentsMd = existsLocally && fs.existsSync(path.join(localPath, "AGENTS.md"));
    const workspacePath = raw.localRelPath.replace(/\\/g, "/");
    const dedupeKey = workspacePath;

    if (byLocalPath.has(dedupeKey)) {
      return;
    }

    const entry = {
      repoName,
      repoUrl: `https://github.com/${CONTROL_OWNER}/${repoName}`,
      rootKey: raw.rootKey,
      localRelPath: workspacePath,
      workspacePath,
      localPath,
      existsLocally,
      kind: raw.kind,
      family: detectFamily(raw.rootKey, repoName),
      baseBranch,
      reviewTarget,
      hasAgentsMd,
    };

    byLocalPath.set(dedupeKey, entry);
    entries.push(entry);
  }

  for (const root of roots) {
    addEntry({
      rootKey: root.key,
      localRelPath: root.relPath,
      kind: "root",
      remoteUrl: git(path.join(workspaceRoot, root.relPath), ["remote", "get-url", "origin"]),
    });

    const submodules = parseGitmodules(path.join(workspaceRoot, root.relPath));
    for (const submodule of submodules) {
      const repoName = parseControleRepoName(submodule.url);
      if (!repoName) {
        continue;
      }

      addEntry({
        rootKey: root.key,
        localRelPath: path.join(root.relPath, submodule.path),
        kind: "submodule",
        remoteUrl: submodule.url,
        declaredBranch: submodule.branch || "",
      });
    }
  }

  return entries;
}

function sync() {
  const entries = collectEntries();

  for (const entry of entries) {
    if (!entry.existsLocally) {
      continue;
    }

    for (const type of types) {
      const wrapperPath = path.join(entry.localPath, ".github", "agents", `${type}.agent.md`);
      writeFile(wrapperPath, renderWrapper(type, entry));
    }
  }

  console.log(
    `Generated wrappers for ${entries.filter((entry) => entry.existsLocally).length} local checkouts across ${types.length} agent types.`,
  );
}

sync();
