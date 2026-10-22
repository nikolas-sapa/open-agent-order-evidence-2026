export class AppError extends Error {
  constructor(code, message, status = 503) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function readJsonResponse(response, service) {
  if (!response.ok) {
    const denied = response.status === 401 || response.status === 403;
    throw new AppError(denied ? 'UNAUTHORIZED' : 'UPSTREAM_FAILURE',
      denied ? `${service} access was denied.` : `${service} request failed (${response.status}).`);
  }
  const text = await response.text();
  if (text.length > 2_000_000) throw new AppError('UPSTREAM_FAILURE', `${service} response exceeds the limit.`);
  try { return JSON.parse(text); }
  catch { throw new AppError('UPSTREAM_FAILURE', `${service} returned an unreadable response.`); }
}
