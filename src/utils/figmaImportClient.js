import { figmaFileToNodes, parseFigmaFileKey, parseFigmaNodeId } from './figmaImport';

async function parseApiError(res) {
  try {
    const data = await res.json();
    if (res.status === 404) {
      if (data.error === 'Figma file not found' || data.error === 'Figma node not found' || data.error === 'No nodes found') {
        return `${data.error}. ${data.details || ''}`;
      }
      return 'Figma import API not found — use production or run `npx vercel dev` locally.';
    }
    if (res.status === 403) {
      return `${data.error || 'Access denied'}. ${data.details || 'Check your Figma token permissions.'}`;
    }
    return data.details ? `${data.error}: ${data.details}` : (data.error || `Import failed (${res.status})`);
  } catch {
    return `Import failed (${res.status})`;
  }
}

export async function fetchFigmaFile({ token, fileUrl, fileKey, nodeId, nodeUrl }) {
  const res = await fetch('/api/figma-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, fileUrl, fileKey, nodeId, nodeUrl })
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export function importFigmaJson(figmaPayload, options = {}) {
  const figma = figmaPayload.figma || figmaPayload;
  const nodeId = options.nodeId || figmaPayload.nodeId || parseFigmaNodeId(options.nodeUrl || '');
  return figmaFileToNodes(figma, { nodeId, pageName: options.pageName });
}

export async function importFromFigmaUrl({ token, fileUrl, nodeUrl, pageName }) {
  const payload = await fetchFigmaFile({ token, fileUrl, nodeUrl });
  return importFigmaJson(payload, { nodeId: payload.nodeId, pageName });
}

export function importFromFigmaJsonString(jsonString, options = {}) {
  const parsed = JSON.parse(jsonString);
  return importFigmaJson(parsed, options);
}

export { parseFigmaFileKey, parseFigmaNodeId };
