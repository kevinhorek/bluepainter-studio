import { parseFigmaFileKey, parseFigmaNodeId } from '../src/utils/figmaImport.js';
import { preflight, readJsonBody } from './_lib/http.js';

export default async function handler(req, res) {
  if (preflight(req, res, { blockDisallowedOrigin: true })) return;

  try {
    const parsed = readJsonBody(req);
    if (!parsed.ok) return res.status(400).json({ error: 'Invalid JSON body' });
    const { token, fileUrl, fileKey, nodeId, nodeUrl } = parsed.body;

    if (typeof token !== 'string' || !token.trim()) {
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
