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
        details: 'Either provide a token in the request body or set FIGMA_TOKEN environment variable'
      });
    }

    const key = parseFigmaFileKey(fileKey || fileUrl || '');
    if (!key) {
      return res.status(400).json({ error: 'Invalid Figma file URL or key' });
    }

    const targetNodeId = parseFigmaNodeId(nodeUrl || nodeId || fileUrl || '');

    let figmaData;
    if (targetNodeId) {
      const nodesRes = await fetch(
        `https://api.figma.com/v1/files/${key}/nodes?ids=${encodeURIComponent(targetNodeId)}`,
        { headers: { 'X-Figma-Token': figmaToken } }
      );
      if (!nodesRes.ok) {
        const status = nodesRes.status;
        const err = await nodesRes.text();
        if (status === 403) {
          return res.status(403).json({
            error: 'Figma API access denied',
            details: 'Invalid token or insufficient permissions. Create a new token at figma.com/developers with file_content:read scope.'
          });
        }
        if (status === 404) {
          return res.status(404).json({
            error: 'Figma node not found',
            details: 'The specified node ID does not exist or you do not have access to this file.'
          });
        }
        return res.status(502).json({ error: 'Figma API error', details: err });
      }
      figmaData = await nodesRes.json();
      
      if (!figmaData.nodes || Object.keys(figmaData.nodes).length === 0) {
        return res.status(404).json({
          error: 'No nodes found',
          details: 'The specified node ID returned empty results. Check the node URL or try importing the entire file.'
        });
      }
    } else {
      const fileRes = await fetch(`https://api.figma.com/v1/files/${key}?depth=4`, {
        headers: { 'X-Figma-Token': figmaToken }
      });
      if (!fileRes.ok) {
        const status = fileRes.status;
        const err = await fileRes.text();
        if (status === 403) {
          return res.status(403).json({
            error: 'Figma API access denied',
            details: 'Invalid token or insufficient permissions. Create a new token at figma.com/developers with file_content:read scope.'
          });
        }
        if (status === 404) {
          return res.status(404).json({
            error: 'Figma file not found',
            details: 'The file does not exist or you do not have access. Check the file URL and token permissions.'
          });
        }
        return res.status(502).json({ error: 'Figma API error', details: err });
      }
      figmaData = await fileRes.json();
    }

    return res.status(200).json({
      fileKey: key,
      nodeId: targetNodeId,
      figma: figmaData,
      fileName: figmaData.name || figmaData.nodes?.[targetNodeId]?.document?.name
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Figma import failed' });
  }
}
