# team-lead-workflow

Single-page React app documenting the [opencode-team-lead](https://github.com/azrod/opencode-team-lead) plugin's workflow and philosophy. Deployed to GitHub Pages.

## Structure

```
team-lead-workflow/
├── src/
│   └── App.tsx        # All application code — two views, FR/EN i18n
├── bundle.html        # Pre-built self-contained bundle — what GitHub Pages serves
├── dist/              # Vite build output (not deployed directly)
├── index.html         # Vite dev server entry point
├── vite.config.ts
└── package.json
```

## Views

The app has two views navigable via a CTA button:

| View | Description |
|------|-------------|
| Intro screen | Presents Orion: concept, philosophy, available agents, typical use cases |
| Flowchart | Interactive SVG diagram of the 5-phase workflow with a detail panel |

Both views support FR/EN language toggle (default: EN).

## Local development

```bash
npm install
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # TypeScript check + Vite build to dist/
npm run preview   # Preview the dist/ build locally
```

## Updating content

All user-facing text lives in `src/App.tsx`. Always update both `en` and `fr` entries.

### Translations

Find the `translations` object near the top of `App.tsx`. Add or update keys in both language branches:

```ts
const translations: Record<Lang, Translations> = {
  en: { /* ... */ },
  fr: { /* ... */ },
};
```

### Flowchart data

The flowchart content is returned by `getFlowchartData(lang)`. It contains two parts:

| Key | What it controls |
|-----|-----------------|
| `svgLabels` | Text labels rendered inside the SVG diagram nodes and arrows |
| `details` | Content shown in the right-panel when a node is clicked |
| `brainstormSvgLabels` | Labels for the brainstorm sub-flowchart |
| `brainstormDetails` | Detail panel content for the brainstorm flowchart |

Update both the `"fr"` branch and the `"en"` branch (returned as the default).

## Deployment

GitHub Pages is deployed automatically by `.github/workflows/pages.yml` on every push to `main` that modifies `bundle.html`.

The workflow does not run a build — it copies `bundle.html` directly to the served `_site/index.html`. **You must commit `bundle.html` along with any source changes.**

## bundle.html

`bundle.html` is a self-contained single HTML file: all JavaScript and CSS from the Vite build are inlined directly into `<script>` and `<style>` tags. No external assets are required.

`dist/index.html` (Vite's default output) references separate asset files under `dist/assets/` and cannot be deployed standalone.

### Rebuilding bundle.html

```bash
npm run bundle
```

Then commit both `src/App.tsx` and `bundle.html`.
