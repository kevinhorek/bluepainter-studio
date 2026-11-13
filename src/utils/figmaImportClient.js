import { figmaFileToNodes, parseFigmaFileKey, parseFigmaNodeId } from './figmaImport';

async function parseApiError(res) {
  try {
    const data = await res.json();
    const errorMsg = data.error || 'Import failed';
    const details = data.details || '';
    
    if (res.status === 404) {
      if (errorMsg.includes('API not found') || errorMsg.includes('endpoint')) {
        return 'Figma import API not available. Use production (bluepainter-studio.vercel.app) or run `npx vercel dev` locally. Alternatively, use the "Paste JSON" tab.';
      }
      return details ? `${errorMsg}: ${details}` : errorMsg;
    }
    if (res.status === 403) {
      return details ? `${errorMsg}: ${details}` : `${errorMsg}. Generate a new token at figma.com/developers/api#access-tokens with file_content:read scope.`;
    }
    if (res.status === 429) {
      return details ? `${errorMsg}: ${details}` : 'Figma rate limit exceeded (1000 requests/hour). Wait 5-10 minutes or use "Paste JSON" tab.';
    }
    if (res.status === 504) {
      return details ? `${errorMsg}: ${details}` : 'Figma request timed out. File may be too large. Try importing a specific frame or use "Paste JSON".';
    }
    if (res.status >= 500) {
      return details ? `${errorMsg}: ${details}` : `${errorMsg}. Figma service may be down. Check status.figma.com or try "Paste JSON".`;
    }
    return details ? `${errorMsg}: ${details}` : `${errorMsg} (HTTP ${res.status})`;
  } catch {
    if (res.status === 404) return 'API endpoint not found. Use "Paste JSON" tab or deploy API.';
    return `Import failed (HTTP ${res.status}). Try the "Paste JSON" method.`;
  }
}

function validateToken(token) {
  if (!token || typeof token !== 'string') return 'Token is required';
  const trimmed = token.trim();
  if (trimmed.length < 20) return 'Token is too short (minimum 20 characters)';
  if (trimmed.length > 200) return 'Token is too long (maximum 200 characters)';
  if (!trimmed.startsWith('figd_')) return 'Token must start with "figd_" (personal access token required)';
  return null;
}

function validateFileKey(key) {
  if (!key || typeof key !== 'string') return 'File URL or key is required';
  if (key.length < 10) return 'File key is too short (expected 22+ characters)';
  if (key.length > 50) return 'File key is too long';
  if (!/^[a-zA-Z0-9]+$/.test(key)) return 'File key must be alphanumeric (found in URL after /design/)';
  return null;
}

function validateNodeId(nodeId) {
  if (!nodeId) return null;
  if (typeof nodeId !== 'string') return 'Node ID must be a string';
  if (!/^\d+:\d+$/.test(nodeId)) return `Node ID "${nodeId}" is invalid. Expected format: "123:456" (from node-id=123-456 in URL)`;
  return null;
}

export async function fetchFigmaFile({ token, fileUrl, fileKey, nodeId, nodeUrl }) {
  const tokenError = validateToken(token);
  if (tokenError) throw new Error(tokenError);
  
  const key = parseFigmaFileKey(fileKey || fileUrl || '');
  const keyError = validateFileKey(key);
  if (keyError) throw new Error(`Invalid file URL: ${keyError}. Paste a URL like https://www.figma.com/design/ABC123/My-File`);
  
  const parsedNodeId = parseFigmaNodeId(nodeUrl || nodeId || '');
  const nodeError = validateNodeId(parsedNodeId);
  if (nodeError) throw new Error(nodeError);
  
  try {
    const res = await fetch('/api/figma-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, fileUrl, fileKey, nodeId, nodeUrl })
    });
    if (!res.ok) throw new Error(await parseApiError(res));
    const data = await res.json();
    
    if (!data.figma) throw new Error('API returned invalid response (missing figma data)');
    
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Network error: Cannot reach API. Check your connection or use "Paste JSON" tab.', { cause: err });
    }
    throw err;
  }
}

export function importFigmaJson(figmaPayload, options = {}) {
  if (!figmaPayload) throw new Error('Figma data is required');
  
  const figma = figmaPayload.figma || figmaPayload;
  if (typeof figma !== 'object' || !figma) {
    throw new Error('Invalid Figma JSON structure (expected an object with document/nodes)');
  }
  
  if (!figma.document && !figma.nodes) {
    throw new Error('Figma JSON is missing "document" and "nodes" fields. Ensure you copied the full API response from GET /v1/files/:key');
  }
  
  const nodeId = options.nodeId || figmaPayload.nodeId || parseFigmaNodeId(options.nodeUrl || '');
  const nodeError = validateNodeId(nodeId);
  if (nodeError) throw new Error(nodeError);
  
  return figmaFileToNodes(figma, { nodeId, pageName: options.pageName });
}

export async function importFromFigmaUrl({ token, fileUrl, nodeUrl, pageName }) {
  const payload = await fetchFigmaFile({ token, fileUrl, nodeUrl });
  return importFigmaJson(payload, { nodeId: payload.nodeId, pageName });
}

export function importFromFigmaJsonString(jsonString, options = {}) {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('JSON string is required');
  }
  
  const trimmed = jsonString.trim();
  if (trimmed.length < 50) {
    throw new Error('JSON is too short (expected at least 50 characters). Paste the full Figma API response.');
  }
  
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    throw new Error('Invalid JSON format (must start with { or [). Ensure you copied the raw API response, not HTML or formatted text.');
  }
  
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    throw new Error(`JSON parse error: ${err.message}. Verify you copied the complete API response from GET /v1/files/:key`, { cause: err });
  }
  
  return importFigmaJson(parsed, options);
}

export { parseFigmaFileKey, parseFigmaNodeId };
