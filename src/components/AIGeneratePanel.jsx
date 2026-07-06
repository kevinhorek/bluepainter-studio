import { useState, useMemo, useEffect } from 'react';
import { GENERATION_TYPES, PROMPT_SUGGESTIONS, GENERATION_SCHEMAS } from '../utils/aiPrompts';
import { generateWithAI } from '../utils/aiGenerate';
import { loadOpenAIKey, saveOpenAIKey, maskKey } from '../utils/aiStorage';
import { buildAIContext } from '../utils/aiApply';

export default function AIGeneratePanel({
  isOpen,
  onClose,
  nodesByFile,
  activeFile,
  initialType = 'full-marketing',
  onApply,
  onNotify
}) {
  const [type, setType] = useState(initialType);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [apiKey, setApiKey] = useState(() => loadOpenAIKey());
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    if (isOpen) setType(initialType);
  }, [isOpen, initialType]);

  const context = useMemo(
    () => buildAIContext(nodesByFile, activeFile),
    [nodesByFile, activeFile]
  );

  const suggestions = PROMPT_SUGGESTIONS[type] || PROMPT_SUGGESTIONS.custom;
  const typeMeta = GENERATION_TYPES.find((t) => t.id === type);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      onNotify?.('Describe what you want to generate');
      return;
    }
    setGenerating(true);
    setPreview(null);
    try {
      saveOpenAIKey(apiKey.trim());
      const result = await generateWithAI({
        type,
        prompt: prompt.trim(),
        context,
        apiKey: apiKey.trim() || undefined
      });
      setPreview(result);
    } catch (err) {
      onNotify?.(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (!preview?.updates?.length) return;
    onApply?.({ type, updates: preview.updates, message: preview.message, source: preview.source });
    setPreview(null);
    onNotify?.(preview.message || 'Applied to canvas');
  };

  if (!isOpen) return null;

  return (
    <>
      <button type="button" className="ai-panel-backdrop" onClick={onClose} aria-label="Close AI panel" />
      <aside className="ai-panel">
        <div className="ai-panel-header">
          <div>
            <h2>AI Generate</h2>
            <p className="ai-panel-subtitle">Create app UI &amp; marketing from a prompt</p>
          </div>
          <button type="button" className="detail-drawer-close" onClick={onClose}>×</button>
        </div>

        <div className="ai-panel-body">
          <div className="ai-type-grid">
            {GENERATION_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`ai-type-chip ${type === t.id ? 'active' : ''}`}
                onClick={() => { setType(t.id); setPreview(null); }}
              >
                <span className="ai-type-chip-label">{t.label}</span>
                <span className="ai-type-chip-desc">{t.description}</span>
              </button>
            ))}
          </div>

          <label className="export-label">
            Describe what to generate
            <textarea
              className="ai-prompt-input"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g. ${suggestions[0]}`}
            />
          </label>

          <div className="ai-suggestions">
            {suggestions.map((s) => (
              <button key={s} type="button" className="ai-suggestion-btn" onClick={() => setPrompt(s)}>
                {s}
              </button>
            ))}
          </div>

          <div className="ai-context-strip">
            <span>Context:</span>
            <code>{context.brandName}</code>
            <code>{context.heroTitle?.slice(0, 28)}…</code>
            <code>{context.price}</code>
          </div>

          <button type="button" className="ai-generate-btn" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : `Generate ${typeMeta?.label || 'content'}`}
          </button>

          {preview && (
            <div className="ai-preview">
              <div className="ai-preview-header">
                <span>{preview.source === 'openai' ? '✨ AI result' : 'Demo mode result'}</span>
                <span className="ai-preview-count">{preview.updates.length} updates</span>
              </div>
              <p className="ai-preview-message">{preview.message}</p>
              <ul className="ai-preview-list">
                {preview.updates.slice(0, 8).map((u) => (
                  <li key={`${u.fileId}-${u.nodeId}`}>
                    <code>{u.fileId}/{u.nodeId}</code>
                    <span>{u.text?.slice(0, 60)}{(u.text?.length || 0) > 60 ? '…' : ''}</span>
                  </li>
                ))}
                {preview.updates.length > 8 && (
                  <li className="ai-preview-more">+{preview.updates.length - 8} more</li>
                )}
              </ul>
              <button type="button" className="export-download-btn" onClick={handleApply}>
                Apply to canvas
              </button>
            </div>
          )}

          <div className="ai-settings">
            <button type="button" className="ai-settings-toggle" onClick={() => setShowKeyInput(!showKeyInput)}>
              {showKeyInput ? 'Hide API key' : 'OpenAI API key (optional)'}
              {apiKey && !showKeyInput && <span className="ai-key-mask">{maskKey(apiKey)}</span>}
            </button>
            {showKeyInput && (
              <>
                <input
                  type="password"
                  className="ai-key-input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-… (stored locally in your browser)"
                />
                <p className="ai-settings-note">
                  Without a key, demo mode uses smart templates. Add <code>OPENAI_API_KEY</code> on Vercel for live AI for all users.
                </p>
              </>
            )}
          </div>

          <p className="ai-targets-note">
            Updates: {GENERATION_SCHEMAS[type]?.allowed.length || 0} canvas nodes · visible on MarketingPage, Hero, Pricing
          </p>
        </div>
      </aside>
    </>
  );
}
