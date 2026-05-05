function envInt(name, fallback) {
  const raw = (process.env[name] || '').trim();
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function githubRetryConfig(prefix = 'GITHUB') {
  return {
    maxAttempts: envInt(`${prefix}_RETRY_ATTEMPTS`, envInt('GITHUB_RETRY_ATTEMPTS', 3)),
    baseDelayMs: envInt(`${prefix}_RETRY_DELAY_MS`, envInt('GITHUB_RETRY_DELAY_MS', 2000)),
    maxDelayMs: envInt(`${prefix}_RETRY_MAX_DELAY_MS`, envInt('GITHUB_RETRY_MAX_DELAY_MS', 15000)),
  };
}

export function isRetriableStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

export function isRetriableGraphQLErrors(errors = []) {
  return errors.some((error) =>
    /rate limit|secondary rate|timeout|temporar|try again|internal|unavailable/i.test(error?.message || '')
  );
}

export function retryableError(message, details = {}) {
  const error = new Error(message);
  error.retryable = true;
  Object.assign(error, details);
  return error;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryAsync(run, options = {}) {
  const {
    label = 'operation',
    maxAttempts = 3,
    baseDelayMs = 2000,
    maxDelayMs = 15000,
  } = options;

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await run(attempt);
    } catch (error) {
      lastError = error;
      if (!error?.retryable || attempt >= maxAttempts) {
        throw error;
      }
      const delayMs = Math.min(maxDelayMs, baseDelayMs * (2 ** (attempt - 1)));
      console.warn(
        `[retry] ${label} failed on attempt ${attempt}/${maxAttempts}: ${error.message || error}. Retrying in ${delayMs}ms.`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}
