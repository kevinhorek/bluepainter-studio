import { supabase } from '../supabaseClient';

export async function listProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, updated_at, last_opened_at')
      .order('last_opened_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Projects] Failed to list:', error);
    return { data: null, error };
  }
}

export async function createProject(name, description = '', studioState = null, activeFile = 'dashboard') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        owner_id: user.id,
        studio_state: studioState,
        studio_active_file: activeFile,
        last_opened_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Projects] Failed to create:', error);
    return { data: null, error };
  }
}

export async function loadProject(projectId) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;

    await supabase
      .from('projects')
      .update({ last_opened_at: new Date().toISOString() })
      .eq('id', projectId);

    return { data, error: null };
  } catch (error) {
    console.error('[Projects] Failed to load:', error);
    return { data: null, error };
  }
}

export async function updateProjectState(projectId, studioState, activeFile) {
  try {
    const { error } = await supabase
      .from('projects')
      .update({
        studio_state: studioState,
        studio_active_file: activeFile,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('[Projects] Failed to update state:', error);
    return { error };
  }
}

export async function updateProjectMeta(projectId, name, description) {
  try {
    const { error } = await supabase
      .from('projects')
      .update({
        name,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('[Projects] Failed to update meta:', error);
    return { error };
  }
}

export async function deleteProject(projectId) {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('[Projects] Failed to delete:', error);
    return { error };
  }
}
