# Authentication & Projects

BluePainter Studio now requires authentication and stores your work in per-account projects on Supabase.

## Backend Setup

The BluePainter backend is hosted on Supabase project **haafbckedfzkwgetodxg**.

**Database Schema:**

### `public.profiles`
Auto-created on signup via Supabase Auth trigger.

### `public.projects`
Stores per-user projects with canvas state:

```sql
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  studio_state jsonb,
  studio_active_file text,
  last_opened_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies ensure users only see their own projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = owner_id);
```

**Key fields:**
- `studio_state`: JSON blob storing `nodesByFile` canvas state
- `studio_active_file`: Last active file (e.g., `"dashboard"`)
- `last_opened_at`: Updated when project is opened

## Environment Configuration

Create a `.env` file (based on `.env.example`):

```bash
# Required for authentication and projects
VITE_SUPABASE_URL=https://haafbckedfzkwgetodxg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_w1cL-8EywkD5qeQF3oVp9Q_fSQaQIzV

# Optional: for serverless functions (AI, Figma, GitHub, Vercel)
# OPENAI_API_KEY=...
# FIGMA_ACCESS_TOKEN=...
# GITHUB_TOKEN=...
# VERCEL_TOKEN=...
```

**Important:** Never commit `.env` to git. Use `.env.example` for reference.

## Supabase Auth Redirect URLs

Configure these in the Supabase Dashboard under **Authentication > URL Configuration**:

- **Site URL:** `https://www.bluepainter.com`
- **Redirect URLs (allow list):**
  - `http://localhost:5173/#/app`
  - `http://localhost:5173`
  - `https://www.bluepainter.com/#/app`
  - `https://www.bluepainter.com`
  - `https://bluepainter-launch.vercel.app/#/app`
  - `https://bluepainter-launch.vercel.app`

These URLs must be added so magic link emails and OAuth redirects work correctly.

## User Flow

1. **Landing page** (`#/home`) is public — no auth required
2. **Studio access** (`#/app`) requires sign-in
   - If not authenticated, show Auth modal with:
     - Magic link (email OTP)
     - Email/password sign-in
     - Email/password sign-up
3. **After sign-in**, show Project Picker to:
   - Create new project (blank or from demo template)
   - Open existing project
4. **Studio session** loads `studio_state` from selected project
5. **Autosave** writes `studio_state` + `studio_active_file` back to Supabase every 2 seconds (debounced)

## Code Architecture

### Files Added

- `src/lib/supabaseClient.js` — Supabase client init
- `src/lib/auth/AuthContext.jsx` — Auth provider + hooks (`useAuth`)
- `src/lib/auth/AuthModal.jsx` — Sign-in/up UI
- `src/lib/projects/projectsApi.js` — CRUD for projects table
- `src/components/ProjectPicker.jsx` — Project selector UI

### Key Hooks

```jsx
import { useAuth } from './lib/auth/AuthContext';

const { user, loading, signIn, signUp, signInWithOtp, signOut } = useAuth();
```

### Autosave Logic

In `App.jsx`:
```jsx
useEffect(() => {
  if (!currentProject || !user || phase === 'landing') return;

  const timer = setTimeout(async () => {
    await updateProjectState(currentProject.id, nodesByFile, activeFile);
  }, 2000);

  return () => clearTimeout(timer);
}, [currentProject, user, nodesByFile, activeFile, phase]);
```

## Production Deployment

When deploying to Vercel:

1. Set environment variables in **Vercel Dashboard > Settings > Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

2. Ensure Supabase Auth redirect URLs include your production domain.

3. Verify RLS policies are enabled and working via Supabase dashboard.

## Facilitator Mode

Facilitator mode (`?facilitator=1`) is available **only to signed-in users**. All validation session tools (break/fix scenarios, scorecard export) require authentication.

## Troubleshooting

**Magic link not working?**
- Check Supabase Auth redirect URLs are configured
- Verify email template is enabled in Supabase dashboard

**RLS policy errors?**
- Ensure user is signed in (`supabase.auth.getUser()`)
- Check policies in Supabase SQL editor

**Autosave not persisting?**
- Check browser console for Supabase errors
- Verify `VITE_SUPABASE_PUBLISHABLE_KEY` is set correctly

**"Missing VITE_SUPABASE_URL" warning?**
- Create `.env` file with required variables
- Restart dev server after adding env vars
