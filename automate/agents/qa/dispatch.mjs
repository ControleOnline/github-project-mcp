process.env.AGENT_DISPATCH_ROLE = process.env.AGENT_DISPATCH_ROLE || 'qa';
await import('../../scripts/agent-project-dispatch.mjs');
