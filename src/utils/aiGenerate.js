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

    const data = await res.json().catch(() => ({}));

    if (res.status === 503 && data.code === 'NO_KEY') {
      return generateFallback({ type, prompt, context });
    }

    if (!res.ok) {
      throw new Error(data.error || data.details || `Generation failed (${res.status})`);
    }

    return data;
  } catch (err) {
    if (apiKey || err.message.includes('Failed to fetch')) {
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
