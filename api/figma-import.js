import { parseFigmaFileKey, parseFigmaNodeId } from '../src/utils/figmaImport.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { token, fileUrl, fileKey, nodeId, nodeUrl } = body || {};

    const figmaToken = token?.trim() || process.env.FIGMA_TOKEN?.trim();
    if (!figmaToken) {
      return res.status(400).json({
        error: 'Figma personal access token required',
        details: 'Provide a token in the request, set FIGMA_TOKEN environment variable, or use the "Paste JSON" tab to import without API access. Get a token at figma.com/developers/api#access-tokens with file_content:read scope.'
      });
    }
    
    if (figmaToken.length < 20 || figmaToken.length > 200) {
      return res.status(400).json({
        error: 'Invalid token length',
        details: 'Figma tokens are typically 40-100 characters. Check that you copied the entire token from figma.com/developers.'
      });
    }
    
    if (figmaToken && !figmaToken.startsWith('figd_')) {
      return res.status(400).json({
        error: 'Invalid Figma token format',
        details: 'Personal access tokens must start with "figd_". If you have an OAuth token or different format, personal access tokens are required. Generate one at figma.com/developers/api#access-tokens.'
      });
    }

    const key = parseFigmaFileKey(fileKey || fileUrl || '');
    if (!key) {
      return res.status(400).json({
        error: 'Invalid Figma file URL or key',
        details: 'Provide a URL like https://www.figma.com/design/ABC123/My-File or a file key like ABC123. The file key is the alphanumeric part after /design/ in the URL.'
      });
    }
    
    if (key.length < 10 || key.length > 50 || !/^[a-zA-Z0-9]+$/.test(key)) {
      return res.status(400).json({
        error: 'Malformed file key',
        details: `Extracted file key "${key}" looks invalid. Figma file keys are 22-character alphanumeric strings. Check your URL format.`
      });
    }

    const targetNodeId = parseFigmaNodeId(nodeUrl || nodeId || fileUrl || '');
    
    if (targetNodeId && !/^\d+:\d+$/.test(targetNodeId)) {
      return res.status(400).json({
        error: 'Invalid node ID format',
        details: `Node ID "${targetNodeId}" is malformed. Expected format: "123:456". Right-click a frame in Figma → Copy link to get the correct node URL.`
      });
    }

    let figmaData;
    if (targetNodeId) {
      const nodesRes = await fetch(
        `https://api.figma.com/v1/files/${key}/nodes?ids=${encodeURIComponent(targetNodeId)}&depth=4`,
        { 
          headers: { 'X-Figma-Token': figmaToken },
          signal: AbortSignal.timeout(15000)
        }
      );
      if (!nodesRes.ok) {
        const status = nodesRes.status;
        let errorText = '';
        try {
          errorText = await nodesRes.text();
        } catch (textErr) {
          console.error('Failed to read error response:', textErr);
        }
        
        if (status === 403) {
          return res.status(403).json({
            error: 'Figma API access denied',
            details: 'Token invalid, expired, or lacks file_content:read permission. Generate a new token at figma.com/developers/api#access-tokens. If the file is in a private team, your token must have team access.'
          });
        }
        if (status === 404) {
          return res.status(404).json({
            error: 'Figma node not found',
            details: `Node ${targetNodeId} does not exist in file ${key}, or you lack access. Verify the node URL (right-click frame → Copy link) and ensure your token can read this file.`
          });
        }
        if (status === 429) {
          return res.status(429).json({
            error: 'Figma API rate limit exceeded',
            details: 'Figma allows 1000 requests/hour per token. Wait 5-10 minutes or use the "Paste JSON" tab (no API call required). For production, cache imported files.'
          });
        }
        if (status === 500 || status === 502 || status === 503) {
          return res.status(502).json({
            error: 'Figma service error',
            details: 'Figma API returned a server error. This is usually temporary. Try again in 1-2 minutes, or use "Paste JSON" if urgent.'
          });
        }
        return res.status(502).json({ 
          error: 'Figma API error', 
          details: errorText || `HTTP ${status}. Check Figma status at status.figma.com or try "Paste JSON" method.`
        });
      }
      figmaData = await nodesRes.json();
      
      if (!figmaData.nodes || Object.keys(figmaData.nodes).length === 0) {
        return res.status(404).json({
          error: 'No nodes returned by Figma',
          details: `Node ${targetNodeId} returned empty. It may be deleted, on a different page, or hidden. Open the file in Figma, right-click the target frame → Copy link, and try again.`
        });
      }
      
      const nodeData = figmaData.nodes[targetNodeId];
      if (!nodeData || !nodeData.document) {
        return res.status(404).json({
          error: 'Node data missing',
          details: `Figma returned a response but node ${targetNodeId} has no document. It may be a deleted or invalid node. Verify the node URL or import the full file without node-id.`
        });
      }
      
      if (nodeData.document.type === 'DOCUMENT') {
        return res.status(400).json({
          error: 'Cannot import entire document',
          details: 'Node ID points to the document root, not a frame. Right-click a specific frame or component → Copy link, then paste that URL (look for "node-id=" in the URL).'
        });
      }
      
      if (nodeData.document.type === 'PAGE') {
        return res.status(400).json({
          error: 'Cannot import page node',
          details: 'Node ID points to a page, not a frame. Drill into the page, right-click a frame or component → Copy link, then use that URL instead.'
        });
      }
    } else {
      const fileRes = await fetch(`https://api.figma.com/v1/files/${key}?depth=4`, {
        headers: { 'X-Figma-Token': figmaToken },
        signal: AbortSignal.timeout(20000)
      });
      if (!fileRes.ok) {
        const status = fileRes.status;
        let errorText = '';
        try {
          errorText = await fileRes.text();
        } catch (textErr) {
          console.error('Failed to read error response:', textErr);
        }
        
        if (status === 403) {
          return res.status(403).json({
            error: 'Figma API access denied',
            details: 'Token invalid, expired, or lacks file_content:read permission. Generate a new token at figma.com/developers/api#access-tokens. If the file is in a private team, your token must have team access.'
          });
        }
        if (status === 404) {
          return res.status(404).json({
            error: 'Figma file not found',
            details: `File ${key} does not exist, was deleted, or you lack access. Verify the file URL is correct and your token has permission. Check the file in Figma to confirm it exists.`
          });
        }
        if (status === 429) {
          return res.status(429).json({
            error: 'Figma API rate limit exceeded',
            details: 'Figma allows 1000 requests/hour per token. Wait 5-10 minutes or use the "Paste JSON" tab (no API call required). For production, cache imported files.'
          });
        }
        if (status === 500 || status === 502 || status === 503) {
          return res.status(502).json({
            error: 'Figma service error',
            details: 'Figma API returned a server error. This is usually temporary. Try again in 1-2 minutes, or use "Paste JSON" if urgent.'
          });
        }
        return res.status(502).json({ 
          error: 'Figma API error', 
          details: errorText || `HTTP ${status}. Check Figma status at status.figma.com or try "Paste JSON" method.`
        });
      }
      figmaData = await fileRes.json();
      
      if (!figmaData.document) {
        return res.status(502).json({
          error: 'Invalid Figma response',
          details: 'Figma returned a response without a document structure. The file may be corrupted or have an unsupported format. Try exporting JSON via a Figma plugin and use "Paste JSON".'
        });
      }
    }

    const fileName = figmaData.name || figmaData.nodes?.[targetNodeId]?.document?.name || 'Untitled';
    
    return res.status(200).json({
      fileKey: key,
      nodeId: targetNodeId,
      figma: figmaData,
      fileName,
      importedAt: new Date().toISOString(),
      limits: {
        depth: 4,
        message: 'Imported with depth=4 (first 4 nesting levels). Deeply nested nodes may be flattened.'
      }
    });
  } catch (err) {
    console.error('Figma import error:', err);
    
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({
        error: 'Figma API timeout',
        details: 'Request took longer than 15-20 seconds. The file may be very large or Figma API is slow. Try importing a specific frame (node-id) or use "Paste JSON" method.'
      });
    }
    
    if (err.name === 'SyntaxError' || err.message?.includes('JSON')) {
      return res.status(502).json({
        error: 'Invalid Figma API response',
        details: 'Figma returned malformed JSON. This may be a temporary Figma issue. Try again in 1-2 minutes or use "Paste JSON" after manually fetching the file via curl.'
      });
    }
    
    return res.status(500).json({
      error: 'Figma import failed',
      details: err.message || 'Unexpected server error. Try the "Paste JSON" tab to import offline, or check browser console for details.'
    });
  }
}
