import { generateFallback } from './aiFallback';

export async function generateWithAI({ type, prompt, context, apiKey }) {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-OpenAI-Key': apiKey } : {})
      },
      body: JSON.stringify({ type, prompt, context })
    });

    // null = the response wasn't JSON (no API on this host, or an SPA rewrite served HTML)
    const data = await res.json().catch(() => null);

    if (res.ok && Array.isArray(data?.updates)) return data;

    const apiMissing = !data || res.status === 404 || res.status === 405;
    const noKey = res.status === 503 && data?.code === 'NO_KEY';
    if (apiMissing || noKey) {
      // No backend / no key configured: built-in templates, clearly labelled as such.
      return generateFallback({ type, prompt, context });
    }

    // A real error (bad key, quota, upstream failure) must be shown, not papered
    // over with template copy the user would mistake for their model's output.
    throw new Error(data.error || data.details || `Generation failed (${res.status})`);
  } catch (err) {
    // fetch() rejects with TypeError when the network/API is unreachable (wording varies by browser).
    if (err instanceof TypeError) {
      return generateFallback({ type, prompt, context });
    }
    throw err;
  }
}

export async function checkAIAvailable(apiKey) {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-OpenAI-Key': apiKey } : {})
      },
      body: JSON.stringify({ type: 'hero', prompt: 'ping', context: {} })
    });
    if (res.status === 503) {
      const data = await res.json();
      return data.code !== 'NO_KEY';
    }
    return res.ok || res.status === 400;
  } catch {
    return false;
  }
}
