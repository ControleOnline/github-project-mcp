process.env.AGENT_DISPATCH_ROLE = process.env.AGENT_DISPATCH_ROLE || 'developer';
await import('../../scripts/agent-project-dispatch.mjs');
