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

    if (!token?.trim()) {
      return res.status(400).json({ error: 'Figma personal access token is required' });
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
        { headers: { 'X-Figma-Token': token.trim() } }
      );
      if (!nodesRes.ok) {
        const err = await nodesRes.text();
        return res.status(502).json({ error: 'Figma API error', details: err });
      }
      figmaData = await nodesRes.json();
    } else {
      const fileRes = await fetch(`https://api.figma.com/v1/files/${key}?depth=4`, {
        headers: { 'X-Figma-Token': token.trim() }
      });
      if (!fileRes.ok) {
        const err = await fileRes.text();
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
