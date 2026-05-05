process.env.AGENT_DISPATCH_ROLE = process.env.AGENT_DISPATCH_ROLE || 'security';
await import('../../scripts/agent-project-dispatch.mjs');
