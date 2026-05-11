import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim();
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
  console.log(
    JSON.stringify(
      {
        ok: true,
        role,
        discoveryMode: payload.discoveryMode || 'labels-and-columns-only',
        selectedIssue: payload.selectedItem?.issue?.ref || null,
        candidateCount: payload.candidateCount || 0,
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
