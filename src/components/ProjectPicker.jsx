import { useState, useEffect } from 'react';
import { listProjects, createProject, loadProject } from '../lib/projects/projectsApi';
import { getFreshDashboardNodes } from '../utils/demoScenarios';
import { getFreshPricingNodes, getFreshHeroNodes } from '../utils/demoScenarios';
import { getFreshMarketingNodes } from '../data/marketingPage';
import { getEmptyFigmaImportNodes } from '../utils/figmaImport';

export default function ProjectPicker({ onProjectSelected, onCancel }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    const { data, error: loadError } = await listProjects();
    if (loadError) {
      setError(loadError.message);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setError('Project name is required');
      return;
    }

    setCreating(true);
    setError('');

    const initialState = useTemplate ? {
      pricing: getFreshPricingNodes(),
      hero: getFreshHeroNodes(),
      dashboard: getFreshDashboardNodes(),
      marketing: getFreshMarketingNodes(),
      figma: getEmptyFigmaImportNodes(),
      'real-file': null
    } : null;

    const { data, error: createError } = await createProject(
      newProjectName.trim(),
      newProjectDescription.trim(),
      initialState,
      'dashboard'
    );

    setCreating(false);

    if (createError) {
      setError(createError.message);
    } else if (data) {
      onProjectSelected(data, initialState);
    }
  }

  async function handleOpenProject(projectId) {
    setLoading(true);
    setError('');

    const { data, error: openError } = await loadProject(projectId);

    setLoading(false);

    if (openError) {
      setError(openError.message);
    } else if (data) {
      onProjectSelected(data, data.studio_state);
    }
  }

  function formatDate(isoString) {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="modal-backdrop project-picker-backdrop">
      <div className="modal-card project-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Your Projects</h2>
          {onCancel && (
            <button type="button" className="modal-close" onClick={onCancel}>×</button>
          )}
        </div>

        {error && <div className="auth-message auth-error">{error}</div>}

        {!showCreateForm && (
          <>
            <div className="project-picker-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                + New Project
              </button>
            </div>

            {loading && <div className="project-picker-loading">Loading projects...</div>}

            {!loading && projects.length === 0 && (
              <div className="project-picker-empty">
                <p>No projects yet. Create your first project to get started!</p>
              </div>
            )}

            {!loading && projects.length > 0 && (
              <div className="project-picker-list">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className="project-picker-item"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    <div className="project-picker-item-header">
                      <h3>{project.name}</h3>
                      <span className="project-picker-item-date">
                        {formatDate(project.last_opened_at || project.updated_at)}
                      </span>
                    </div>
                    {project.description && (
                      <p className="project-picker-item-description">{project.description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {showCreateForm && (
          <form onSubmit={handleCreateProject} className="project-create-form">
            <div className="form-group">
              <label htmlFor="project-name">Project Name</label>
              <input
                id="project-name"
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Awesome App"
                required
                disabled={creating}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="project-description">Description (optional)</label>
              <textarea
                id="project-description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="A brief description of your project"
                disabled={creating}
                rows={3}
              />
            </div>

            <div className="form-group form-group-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  disabled={creating}
                />
                <span>Start from demo template</span>
              </label>
              <p className="form-hint">
                Includes example pages: Dashboard, Pricing, Hero, and Marketing
              </p>
            </div>

            <div className="project-create-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
                  setUseTemplate(false);
                  setError('');
                }}
                disabled={creating}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
