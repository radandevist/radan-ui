# radan-ui — Phase 1 (repo, release machinery, theme, lint, docs, catalog, v0.1.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the public repo `radandevist/radan-ui` and publish `@radandevist/radan-ui@0.1.0` on npm, containing the
prefixed theme (with its generator), the shared OxLint/oxfmt config, the front-end rule docs and a catalog — with the
full release/maintenance machinery working from day one.

**Architecture:** One npm package, TypeScript, ESM. Tokens are data in `src/theme/tokens.ts`; `generateThemeCss({ prefix })`
turns them into a Tailwind v4 CSS file (`:root` light values, `.dark` values, `@theme inline` mapping Tailwind names to
the prefixed variables). The build writes `dist/theme.css` with the default prefix; a `radan-ui theme --prefix x` CLI
writes another. Lint/format configs ship as JSON files plus the generic JS plugin rules. Releases go through Changesets
→ "Version packages" PR → npm publish with provenance (Trusted Publishing) + tag + GitHub Release. A Vite catalog,
deployed to GitHub Pages, shows the tokens (components come in phase 2).

**Tech Stack:** Node 24, pnpm 10.13.1 (like PublyApp; Radan 2026-11-08), npm registry, TypeScript 7, tsdown, Vitest 5 (+ jsdom later), Tailwind CSS 4.3, React 19 (catalog
only in phase 1), Vite 8, Playwright (catalog visual tests), Changesets, publint, @arethetypeswrong/cli, size-limit,
OxLint 1.80+/oxfmt 0.73+, GitHub Actions, Renovate.

**Spec:** `docs/superpowers/specs/2026-11-08-shared-ui-library-design.md`, approved 2026-11-08.

## Global Constraints

- Repo `radandevist/radan-ui`, **public**, licence **Apache-2.0**; package name **`@radandevist/radan-ui`**.
- Every CSS variable the library defines is prefixed; **default prefix `radan-ui`**; prefix chosen at generation
  (`radan-ui theme --prefix <p>`), must match `^[a-z][a-z0-9-]*$`.
- Token values come from ShopKartOS `src/styles/app.css` (the visual reference). Dark mode = the `.dark` class.
- Three token layers: palette → semantic → component; each overridable by plain CSS after the import.
- Components never spell the prefix (phase 2); they use Tailwind names mapped in `@theme inline`.
- No i18n, no router, no data fetching, nothing private (no app data, secrets, client names) in the repo.
- Package manager pnpm inside this repo only; the published package installs with npm, pnpm, yarn and bun alike
  (CI install matrix); npm only to publish (via Changesets) and for consumers.
- Code style = ShopKartOS: tabs, width 120, single quotes, arrow functions, English code, files under 300 lines.
- Linear history: squash merge only (merge commits and rebase merges disabled, `required_linear_history` on `main`),
  squash title = PR title (Conventional Commits). Radan, 2026-11-08.
- Semver strictly; every package-changing PR carries a changeset; CI must be green to merge into `main`.
- npm publishing only from GitHub Actions with provenance; no long-lived npm token in the repo or CI after v0.1.0.

## File structure (end of phase 1)

```
radan-ui/
  package.json, tsconfig.json, tsdown.config.ts, vitest.config.ts, .oxlintrc.json, .oxfmtrc.json, .size-limit.json
  LICENSE, README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md (generated)
  renovate.json, .changeset/config.json, .changeset/README.md
  .github/workflows/ci.yml, release.yml, pages.yml, changeset-check.yml
  .github/ISSUE_TEMPLATE/bug.yml, feature.yml, .github/pull_request_template.md
  src/index.ts                     — public JS API (generateThemeCss, tokens, DEFAULT_PREFIX)
  src/theme/tokens.ts              — the token data (palette, semantic light/dark, component)
  src/theme/generate.ts            — generateThemeCss({ prefix })
  src/cli.ts                       — `radan-ui theme --prefix <p>` (bin)
  scripts/build-theme.ts           — writes dist/theme.css with the default prefix
  lint/oxlint.json, lint/oxfmt.json, lint/plugins/house/*  — shared config + generic rules
  docs/DESIGN.md, docs/rules/*.md  — the visual language and the front-end rules
  catalog/ (Vite app: index.html, main.tsx, tokens page), catalog/tests/visual.spec.ts
  tests/*.test.ts, tests/fixtures/consumer/  — unit tests + an installed-package fixture
  .ai/maintainer.md                — the maintenance runbook (mirrored as the radan-ui-maintainer skill)
```

---

### Task 1: Repo bootstrap, hygiene files and CI

**Files:**
- Create: `package.json`, `tsconfig.json`, `.oxlintrc.json`, `.oxfmtrc.json`, `vitest.config.ts`, `src/index.ts`,
  `tests/smoke.test.ts`, `LICENSE`, `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  `renovate.json`, `.github/workflows/ci.yml`, `.github/ISSUE_TEMPLATE/bug.yml`, `.github/ISSUE_TEMPLATE/feature.yml`,
  `.github/pull_request_template.md`, `.gitignore`

**Interfaces:**
- Produces: npm scripts `typecheck`, `lint`, `format`, `format:check`, `test`, `check` (all of them) used by every
  later task and by CI.

- [ ] **Step 1: Create the repo (captain, not an executor)**

```bash
gh repo create radandevist/radan-ui --public --license apache-2.0 --description "Radan's UI library: theme, components, lint rules" --clone
cd radan-ui
```

- [ ] **Step 2: package.json**

```json
{
	"name": "@radandevist/radan-ui",
	"version": "0.0.0",
	"description": "Theme, React components and lint rules shared by Radan's apps",
	"license": "Apache-2.0",
	"repository": { "type": "git", "url": "git+https://github.com/radandevist/radan-ui.git" },
	"homepage": "https://radandevist.github.io/radan-ui/",
	"bugs": "https://github.com/radandevist/radan-ui/issues",
	"type": "module",
	"engines": { "node": ">=22" },
	"packageManager": "pnpm@10.13.1",
	"files": ["dist", "lint", "docs", "README.md", "LICENSE", "CHANGELOG.md"],
	"publishConfig": { "access": "public", "provenance": true },
	"scripts": {
		"typecheck": "tsc --noEmit",
		"lint": "oxlint --quiet .",
		"format": "oxfmt --write .",
		"format:check": "oxfmt --check .",
		"test": "vitest run",
		"check": "pnpm typecheck && pnpm lint && pnpm format:check && pnpm test"
	}
}
```

Then `pnpm add -D typescript@^7 oxlint@^1.80 oxfmt@^0.73 vitest@^5 @types/node@^24`.

- [ ] **Step 3: tsconfig.json, .oxfmtrc.json, .oxlintrc.json, vitest.config.ts**

`tsconfig.json`:
```json
{
	"compilerOptions": {
		"target": "ES2024",
		"module": "ESNext",
		"moduleResolution": "Bundler",
		"jsx": "react-jsx",
		"strict": true,
		"noUncheckedIndexedAccess": true,
		"verbatimModuleSyntax": true,
		"skipLibCheck": true,
		"types": ["node"]
	},
	"include": ["src", "tests", "scripts", "catalog", "lint/plugins", "*.config.ts"]
}
```
`.oxfmtrc.json`: copy ShopKartOS `.oxfmtrc.json` verbatim, then set `"$schema": "./node_modules/oxfmt/configuration_schema.json"`,
`"internalPattern": []` and `"ignorePatterns": ["node_modules", "dist", "catalog/dist", "**/*.md", "CHANGELOG.md"]`.
`.oxlintrc.json` (the repo's own; Task 3 makes it extend the shipped one):
```json
{
	"$schema": "./node_modules/oxlint/configuration_schema.json",
	"plugins": ["unicorn", "typescript", "oxc", "react", "vitest"],
	"categories": { "correctness": "error" },
	"env": { "builtin": true, "browser": true, "node": true, "es2024": true },
	"ignorePatterns": ["node_modules/**", "dist/**", "catalog/dist/**"]
}
```
`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
```

- [ ] **Step 4: Smoke test (fails first)**

`tests/smoke.test.ts`:
```ts
import { expect, test } from 'vitest';

import { DEFAULT_PREFIX } from '../src/index';

test('the default CSS prefix is radan-ui', () => {
	expect(DEFAULT_PREFIX).toBe('radan-ui');
});
```
Run: `npx vitest run tests/smoke.test.ts` — Expected: FAIL (cannot find `../src/index`).

- [ ] **Step 5: src/index.ts**

```ts
/** The prefix of every CSS variable the library defines, unless the theme is generated with another one. */
export const DEFAULT_PREFIX = 'radan-ui';
```
Run: `npx vitest run` — Expected: 1 passed.

- [ ] **Step 6: Hygiene files**

- `README.md`: title, one-line purpose, install (`npm i @radandevist/radan-ui`), "Theme" section (import
  `@radandevist/radan-ui/theme.css` after `@import 'tailwindcss'`; `.dark` on `<html>`), "Custom prefix" (CLI line),
  "Overrides" (redefine a variable after the import; example `--radan-ui-card-radius: 16px`), "Lint" (Task 3 fills),
  links to the catalog and `docs/`. Status badge for CI and npm version.
- `CONTRIBUTING.md`: setup (`pnpm install`, `pnpm check`), Conventional Commits, "every PR that changes the package needs a
  changeset (`npx changeset`)", semver rules copied from the spec §7, how visual changes need catalog captures.
- `CODE_OF_CONDUCT.md`: Contributor Covenant 2.1 text, contact = GitHub private report link.
- `SECURITY.md`: supported versions (latest minor), report through GitHub "Report a vulnerability" (private
  vulnerability reporting), response within 7 days.
- `renovate.json`: `{ "extends": ["config:recommended", ":semanticCommits"], "rangeStrategy": "bump", "packageRules": [{ "matchUpdateTypes": ["minor", "patch"], "matchDepTypes": ["devDependencies"], "automerge": true }] }`
- Issue forms `bug.yml` (version, what happened, expected, repro link, light/dark, browser) and `feature.yml` (need,
  proposed API, alternatives); `pull_request_template.md` (what/why, changeset added?, catalog captures for visual
  changes, checklist: `pnpm check` green).
- `.gitignore`: `node_modules`, `dist`, `catalog/dist`, `.DS_Store`, `test-results`, `playwright-report`.

- [ ] **Step 7: CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm audit --audit-level high
```

- [ ] **Step 8: Verify and commit**

Run: `pnpm check` — Expected: exit 0.
```bash
git add -A && git commit -m "chore: bootstrap repo, hygiene files and CI" && git push
```

- [ ] **Step 9: Protect main (captain)**

```bash
gh api -X PUT repos/radandevist/radan-ui/branches/main/protection --input - <<'EOF'
{ "required_status_checks": { "strict": true, "contexts": ["check"] }, "enforce_admins": false,
  "required_pull_request_reviews": null, "restrictions": null, "required_linear_history": true, "allow_force_pushes": false, "allow_deletions": false }
EOF
gh api -X PUT repos/radandevist/radan-ui/private-vulnerability-reporting
```
From here on, every change lands through a PR.

---

### Task 2: Theme tokens, generator, CLI and the built theme.css

**Files:**
- Create: `src/theme/tokens.ts`, `src/theme/generate.ts`, `src/cli.ts`, `scripts/build-theme.ts`,
  `tests/generate.test.ts`, `tests/cli.test.ts`
- Modify: `src/index.ts`, `package.json` (bin, scripts)

**Interfaces:**
- Produces: `generateThemeCss(options?: { prefix?: string }): string`; `tokens` (type `Tokens`); CLI
  `radan-ui theme [--prefix <p>]` printing the CSS on stdout; `dist/theme.css` (default prefix).

> **Native-ready (addendum [cross-platform-native-design](../specs/2026-11-08-cross-platform-native-design.md),
> decision 3):** keep `tokens.ts` pure data and `generate.ts` the only place that knows CSS syntax, so Phase 2 can add a
> native output (`resolveTokens(mode)` and the NativeWind theme) from the same data. Nothing else changes in this task.

- [ ] **Step 1: tokens.ts (the data, values from ShopKartOS `src/styles/app.css` 2026-11-08)**

```ts
/**
 * The design tokens, in three layers (spec §2). Palette: the raw brand colours. Semantic: what a colour is for, light
 * and dark (a value is a hex/CSS value, or `{ palette: name }`). Component: one knob per component, pointing at a
 * semantic token (`{ semantic: name }`) or a CSS value. Values copied from ShopKartOS, the visual reference.
 */
type PaletteRef = { palette: keyof typeof palette };
type SemanticRef = { semantic: string };
export type TokenValue = string | PaletteRef | SemanticRef;

export const palette = {
	yellow: '#fecd00',
	'yellow-ink': '#423600',
	cyan: '#01d4f3',
	ink: '#18181b',
	paper: '#feffff',
} as const;

export const semantic: { light: Record<string, TokenValue>; dark: Record<string, TokenValue> } = {
	light: {
		background: '#f7f7f7',
		foreground: { palette: 'ink' },
		'foreground-secondary': '#3f3f46',
		card: '#f2f2f2',
		'card-foreground': { palette: 'ink' },
		popover: '#f2f2f2',
		'popover-foreground': { palette: 'ink' },
		'popover-surface': '#fff',
		primary: { palette: 'yellow' },
		'primary-foreground': { palette: 'yellow-ink' },
		secondary: '#f2f2f2',
		'secondary-foreground': '#3f3f46',
		muted: '#f7f7f7',
		'muted-foreground': '#71717a',
		accent: { palette: 'cyan' },
		'accent-foreground': { palette: 'ink' },
		destructive: '#b91c1c',
		'destructive-surface': '#fef2f2',
		'status-success': '#15803d',
		'status-warning': '#b45309',
		'status-open-background': '#dff2fe',
		'status-open-foreground': '#00598a',
		'status-open-border': '#b8e6fe',
		'status-pending-background': '#fef3c7',
		'status-pending-foreground': '#92400e',
		'status-pending-border': '#fde68a',
		'status-resolved-background': '#dcfce7',
		'status-resolved-foreground': '#166534',
		'status-resolved-border': '#bbf7d0',
		'status-closed-background': '#f4f4f5',
		'status-closed-foreground': '#52525b',
		'status-closed-border': '#e4e4e7',
		'status-breached-background': '#fff1f2',
		'status-breached-foreground': '#be123c',
		'status-breached-border': '#fecdd3',
		border: '#e3e3e3',
		input: '#414141',
		'input-border': '#e4e4e7',
		ring: { palette: 'ink' },
		sidebar: '#f6f6f6',
		'sidebar-foreground': '#71717a',
		'sidebar-accent': '#fff',
		'sidebar-accent-foreground': { palette: 'ink' },
		'sidebar-ring': 'oklch(0.705 0.015 286.067)',
		radius: '0.625rem',
		'effect-raised-control': '0 0 0 1px var(--{p}-border)',
		'effect-primary-raised': '0 0 0 1px rgb(120 96 0 / 30%)',
		'effect-popover': '0 0 0 1px rgb(0 0 0 / 6%), 0 4px 8px -2px rgb(0 0 0 / 6%), 0 12px 24px -6px rgb(0 0 0 / 12%)',
	},
	dark: {
		background: { palette: 'ink' },
		foreground: { palette: 'paper' },
		'foreground-secondary': '#d4d4d8',
		card: '#1f1f23',
		'card-foreground': { palette: 'paper' },
		popover: '#1f1f23',
		'popover-foreground': { palette: 'paper' },
		'popover-surface': '#1f1f23',
		secondary: '#222226',
		'secondary-foreground': '#d4d4d8',
		muted: '#1f1f23',
		'muted-foreground': '#7f7f7f',
		'accent-foreground': { palette: 'paper' },
		destructive: '#fca5a5',
		'destructive-surface': '#450909',
		'status-success': '#86efac',
		'status-warning': '#fdd34d',
		'status-open-background': '#082f49',
		'status-open-foreground': '#7dd3fc',
		'status-open-border': '#075985',
		'status-pending-background': '#382b12',
		'status-pending-foreground': '#fcd34d',
		'status-pending-border': '#78551b',
		'status-resolved-background': '#123524',
		'status-resolved-foreground': '#86efac',
		'status-resolved-border': '#226344',
		'status-closed-background': '#27272a',
		'status-closed-foreground': '#d4d4d8',
		'status-closed-border': '#52525b',
		'status-breached-background': '#3f0d1a',
		'status-breached-foreground': '#fda4af',
		'status-breached-border': '#881337',
		border: '#323234',
		input: '#646a7a',
		'input-border': '#27272a',
		ring: '#d4d4d8',
		sidebar: { palette: 'ink' },
		'sidebar-foreground': '#7f7f7f',
		'sidebar-accent': '#27272a',
		'sidebar-accent-foreground': '#fff',
		'sidebar-ring': 'oklch(0.552 0.016 285.938)',
		'effect-popover': '0 0 0 1px rgb(255 255 255 / 8%), 0 12px 24px -6px rgb(0 0 0 / 60%)',
	},
};

/** One knob per component (spec §2): override `--{p}-card-radius` and every card follows. */
export const component: Record<string, TokenValue> = {
	'card-bg': { semantic: 'card' },
	'card-fg': { semantic: 'card-foreground' }, // 0.1.2: was 'card-foreground', which pointed at itself
	'card-radius': '14px',
	'card-shadow': { semantic: 'effect-raised-control' },
	'control-radius': 'calc(var(--{p}-radius) * 1.4)',
	'popover-radius': '14px',
	'toast-radius': '12px',
};

/** Tailwind theme names → the semantic token they read (`@theme inline`). */
export const tailwindColors = [
	'background', 'foreground', 'foreground-secondary', 'card', 'card-foreground', 'popover', 'popover-foreground',
	'popover-surface', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
	'accent', 'accent-foreground', 'destructive', 'destructive-surface', 'status-success', 'status-warning', 'border',
	'input', 'ring', 'sidebar', 'sidebar-foreground', 'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-ring',
] as const;
```
(`{p}` inside a value is replaced by the prefix at generation.)

- [ ] **Step 2: Failing tests**

`tests/generate.test.ts`:
```ts
import { expect, test } from 'vitest';

import { generateThemeCss } from '../src/theme/generate';
import { palette, semantic } from '../src/theme/tokens';

test('default prefix: every library variable is --radan-ui-*', () => {
	const css = generateThemeCss();
	expect(css).toContain('--radan-ui-yellow: #fecd00;');
	expect(css).toContain('--radan-ui-primary: var(--radan-ui-yellow);');
	expect(css).toContain('--radan-ui-card-radius: 14px;');
	// Every declared variable outside @theme carries the prefix.
	const outsideTheme = css.split('@theme inline')[0]!;
	for (const [, name] of outsideTheme.matchAll(/^\s*--([\w-]+):/gm)) {
		expect(name.startsWith('radan-ui-')).toBe(true);
	}
});

test('custom prefix replaces it everywhere, {p} included', () => {
	const css = generateThemeCss({ prefix: 'acme' });
	expect(css).not.toContain('radan-ui');
	expect(css).not.toContain('{p}');
	expect(css).toContain('--acme-effect-raised-control: 0 0 0 1px var(--acme-border);');
});

test('dark values live under .dark, light under :root', () => {
	const css = generateThemeCss();
	const root = css.slice(css.indexOf(':root {'), css.indexOf('.dark {'));
	const dark = css.slice(css.indexOf('.dark {'), css.indexOf('@theme inline'));
	expect(root).toContain('--radan-ui-background: #f7f7f7;');
	expect(dark).toContain('--radan-ui-background: var(--radan-ui-ink);');
	expect(dark).toContain('color-scheme: dark;');
});

test('@theme inline maps Tailwind names to the prefixed tokens', () => {
	const css = generateThemeCss({ prefix: 'x' });
	expect(css).toContain('--color-primary: var(--x-primary);');
	expect(css).toContain('--radius-lg: var(--x-radius);');
	expect(css).toContain('--radius-card: var(--x-card-radius);');
	expect(css).toContain('--shadow-raised-control: var(--x-effect-raised-control);');
});

test('a bad prefix is refused', () => {
	expect(() => generateThemeCss({ prefix: '9x' })).toThrow(/prefix/);
	expect(() => generateThemeCss({ prefix: 'a b' })).toThrow(/prefix/);
});

test('every palette reference exists', () => {
	for (const mode of [semantic.light, semantic.dark]) {
		for (const value of Object.values(mode)) {
			if (typeof value === 'object' && 'palette' in value) {
				expect(Object.keys(palette)).toContain(value.palette);
			}
		}
	}
});
```
Run: `npx vitest run tests/generate.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: generate.ts**

```ts
import { DEFAULT_PREFIX } from '../index';
import { component, palette, semantic, tailwindColors, type TokenValue } from './tokens';

const PREFIX = /^[a-z][a-z0-9-]*$/;

const value = (v: TokenValue, p: string) => {
	if (typeof v === 'string') {
		return v.replaceAll('{p}', p);
	}
	return 'palette' in v ? `var(--${p}-${v.palette})` : `var(--${p}-${v.semantic})`;
};

const block = (selector: string, entries: [string, TokenValue][], p: string, extra: string[] = []) =>
	[`${selector} {`, ...extra, ...entries.map(([k, v]) => `\t--${p}-${k}: ${value(v, p)};`), '}'].join('\n');

/**
 * The theme as a Tailwind v4 CSS file: the palette and light/component tokens on `:root`, the dark ones on `.dark`,
 * and `@theme inline` mapping Tailwind's names (`bg-primary`, `rounded-card`…) to the prefixed variables.
 */
export const generateThemeCss = ({ prefix = DEFAULT_PREFIX }: { prefix?: string } = {}) => {
	if (!PREFIX.test(prefix)) {
		throw new Error(`invalid prefix "${prefix}": expected ${PREFIX.source}`);
	}
	const p = prefix;
	const radius = (n: number) => `calc(var(--${p}-radius) * ${n})`;
	const theme = [
		'@theme inline {',
		...tailwindColors.map((c) => `\t--color-${c}: var(--${p}-${c});`),
		`\t--radius-sm: ${radius(0.6)};`,
		`\t--radius-md: ${radius(0.8)};`,
		`\t--radius-lg: var(--${p}-radius);`,
		`\t--radius-xl: ${radius(1.4)};`,
		`\t--radius-2xl: ${radius(1.8)};`,
		`\t--radius-3xl: ${radius(2.2)};`,
		`\t--radius-4xl: ${radius(2.6)};`,
		`\t--radius-card: var(--${p}-card-radius);`,
		`\t--radius-control: var(--${p}-control-radius);`,
		`\t--radius-popover: var(--${p}-popover-radius);`,
		`\t--radius-toast: var(--${p}-toast-radius);`,
		`\t--shadow-raised-control: var(--${p}-effect-raised-control);`,
		`\t--shadow-primary-raised: var(--${p}-effect-primary-raised);`,
		`\t--shadow-popover: var(--${p}-effect-popover);`,
		'}',
	].join('\n');
	return [
		`/* @radandevist/radan-ui theme — prefix "${p}". Override any variable after this import. */`,
		block(
			':root',
			[...Object.entries(palette), ...Object.entries(semantic.light), ...Object.entries(component)],
			p,
			['\tcolor-scheme: light;'],
		),
		block('.dark', Object.entries(semantic.dark), p, ['\tcolor-scheme: dark;']),
		theme,
		'',
	].join('\n\n');
};
```
Run: `npx vitest run tests/generate.test.ts` — Expected: 6 passed.

- [ ] **Step 4: CLI + its test**

`tests/cli.test.ts`:
```ts
import { execFileSync } from 'node:child_process';

import { expect, test } from 'vitest';

const run = (...args: string[]) =>
	execFileSync('node', ['--import', 'tsx', 'src/cli.ts', ...args], { encoding: 'utf8' });

test('theme prints the CSS with the chosen prefix', () => {
	expect(run('theme', '--prefix', 'acme')).toContain('--acme-primary:');
});

test('theme without --prefix uses radan-ui', () => {
	expect(run('theme')).toContain('--radan-ui-primary:');
});

test('an unknown command exits non-zero with the usage', () => {
	expect(() => run('nope')).toThrow(/usage: radan-ui theme/);
});
```
`src/cli.ts`:
```ts
#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { generateThemeCss } from './theme/generate';

const USAGE = 'usage: radan-ui theme [--prefix <prefix>]';
const { positionals, values } = parseArgs({ allowPositionals: true, options: { prefix: { type: 'string' } } });
if (positionals[0] !== 'theme') {
	process.stderr.write(`${USAGE}\n`);
	process.exit(1);
}
process.stdout.write(generateThemeCss({ prefix: values.prefix }));
```
`pnpm add -D tsx`. Run: `npx vitest run tests/cli.test.ts` — Expected: 3 passed.

- [ ] **Step 5: build-theme script, exports**

`scripts/build-theme.ts`:
```ts
import { mkdirSync, writeFileSync } from 'node:fs';

import { generateThemeCss } from '../src/theme/generate';

mkdirSync('dist', { recursive: true });
writeFileSync('dist/theme.css', generateThemeCss());
```
`src/index.ts` adds: `export { generateThemeCss } from './theme/generate';` and
`export { component, palette, semantic } from './theme/tokens';`.
package.json: `"bin": { "radan-ui": "./dist/cli.js" }`, script `"build:theme": "tsx scripts/build-theme.ts"`.

- [ ] **Step 6: Commit (with a changeset once Task 5 exists; before that, none)**

```bash
pnpm check && git checkout -b feat/theme && git add -A && git commit -m "feat(theme): prefixed tokens, generator and CLI" && gh pr create --fill
```

---

### Task 3: Shared OxLint / oxfmt config and the generic house rules

**Files:**
- Create: `lint/oxlint.json`, `lint/oxfmt.json`, `lint/plugins/house/index.ts` + one file per rule +
  `tests/lint-plugin.test.ts`, `tests/fixtures/lint/{good,bad}.tsx`
- Modify: `.oxlintrc.json` (extends `./lint/oxlint.json`), `README.md` (Lint section), `package.json` (exports)

**Interfaces:**
- Produces: `@radandevist/radan-ui/oxlint.json`, `@radandevist/radan-ui/oxfmt.json` (export map entries), plugin
  `house` (rules: `arrow-function-components`, `no-array-reduce`, `no-console-in-source`, `no-iife`,
  `no-never-any-casts`, `prefer-early-return`).

- [ ] **Step 1:** Copy the GENERIC rules of ShopKartOS `tools/oxlint/house/` (the six above, with their tests;
  NOT `no-db-write-in-loop`, app-specific) into `lint/plugins/house/`. Port their tests to `tests/lint-plugin.test.ts`.
  Run: `npx vitest run tests/lint-plugin.test.ts` — Expected: the ported tests pass.
- [ ] **Step 2:** `lint/oxlint.json` = ShopKartOS `.oxlintrc.json` rules section minus app-specific rules
  (`house/no-db-write-in-loop`, anything naming `src/server`, drizzle, routes), `jsPlugins` =
  `[{ "name": "house", "specifier": "./plugins/house/index.ts" }]`, no `ignorePatterns`, no `$schema`.
  `lint/oxfmt.json` = the repo's `.oxfmtrc.json` without `$schema`/`ignorePatterns`.
- [ ] **Step 3: Consumer proof (the risky part: does `extends` resolve the plugin path relative to the shared file?)**
  `tests/fixtures/lint/.oxlintrc.json` = `{ "extends": ["../../../lint/oxlint.json"] }`. Test runs
  `npx oxlint -c tests/fixtures/lint/.oxlintrc.json tests/fixtures/lint/bad.tsx` and expects a `house/no-iife` error,
  and `good.tsx` clean. If the plugin path does NOT resolve through `extends`, document the consumer form instead
  (consumer lists `jsPlugins` with `"specifier": "@radandevist/radan-ui/lint/plugins/house/index.ts"`) and test that.
- [ ] **Step 4:** Repo `.oxlintrc.json` gets `"extends": ["./lint/oxlint.json"]`; fix what it reports. README "Lint"
  section: the exact consumer snippet proven in Step 3, and `oxfmt -c node_modules/@radandevist/radan-ui/lint/oxfmt.json`.
- [ ] **Step 5:** `pnpm check` — exit 0. Commit `feat(lint): shared oxlint/oxfmt config and generic house rules`, PR.

---

### Task 4: Build, package exports and package checks

**Files:**
- Create: `tsdown.config.ts`, `.size-limit.json`, `tests/package.test.ts`
- Modify: `package.json` (exports, main/types, build scripts, devDeps), `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `pnpm build` → `dist/index.js`, `dist/index.d.ts`, `dist/cli.js`, `dist/theme.css`; export map:
  `"."`, `"./theme.css"`, `"./oxlint.json"`, `"./oxfmt.json"`, `"./lint/*"`, `"./package.json"`.

> **Native-ready (addendum [cross-platform-native-design](../specs/2026-11-08-cross-platform-native-design.md),
> decision 1):** `"."` is the Node-side JS API only and must never re-export React components. Components arrive in
> Phase 2 as per-component subpaths (`"./button"`) with `react-native` / `default` conditions; do not add a wildcard
> export (such as `"./*"`) that would claim those names. Nothing else changes in this task.

- [ ] **Step 1:** `tsdown.config.ts`:
```ts
import { defineConfig } from 'tsdown';

export default defineConfig({ entry: ['src/index.ts', 'src/cli.ts'], format: 'esm', dts: true, clean: false });
```
package.json:
```json
"exports": {
	".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
	"./theme.css": "./dist/theme.css",
	"./oxlint.json": "./lint/oxlint.json",
	"./oxfmt.json": "./lint/oxfmt.json",
	"./lint/*": "./lint/*",
	"./package.json": "./package.json"
},
"sideEffects": ["*.css"],
"scripts": { "build": "rm -rf dist && tsdown && pnpm build:theme", "check:package": "publint --strict && attw --pack . --profile esm-only", "size": "size-limit" }
```
`pnpm add -D tsdown publint @arethetypeswrong/cli size-limit @size-limit/file`.
`.size-limit.json`: `[{ "path": "dist/index.js", "limit": "5 kB" }, { "path": "dist/theme.css", "limit": "8 kB" }]`.
- [ ] **Step 2: Installed-package test** `tests/package.test.ts`: `npm pack` into a temp dir, `npm i` the tarball in a
  temp project, then assert (a) `import('@radandevist/radan-ui')` exposes `generateThemeCss`, (b)
  `node_modules/@radandevist/radan-ui/dist/theme.css` contains `--radan-ui-primary`, (c)
  `npx radan-ui theme --prefix t` prints `--t-primary`. (Mark the test `{ timeout: 120_000 }`; it runs after `pnpm build`.)
- [ ] **Step 2b: Any package manager can install it** (Radan, 2026-11-08). pnpm is only the repo's own tool. The
  package must not depend on pnpm features (no `workspace:` or `catalog:` ranges in the published package.json, no
  pnpm-only fields consumers need). CI job `install-matrix` (after `check`): `pnpm pack`, then for each of npm, pnpm,
  yarn (berry, `nodeLinker: node-modules` AND pnp), bun: create a temp project, install the tarball, run the same three
  assertions as Step 2 (`import`, `theme.css`, `radan-ui theme --prefix t`). README "Install" lists the four commands.
- [ ] **Step 3:** `"check"` script becomes `typecheck && lint && format:check && test && build && check:package && size`;
  CI unchanged (it runs `check`). Run: `pnpm check` — exit 0.
- [ ] **Step 4:** Commit `build: tsdown, export map, publint/attw, size budget, installed-package test`, PR.

---

### Task 5: Changesets, release workflow (npm Trusted Publishing), changeset gate

**Files:**
- Create: `.changeset/config.json`, `.changeset/README.md`, `.github/workflows/release.yml`,
  `.github/workflows/changeset-check.yml`, `.changeset/initial-release.md`

- [ ] **Step 1:** `pnpm add -D @changesets/cli @changesets/changelog-github && npx changeset init`, then
  `.changeset/config.json`:
```json
{
	"$schema": "https://unpkg.com/@changesets/config@3/schema.json",
	"changelog": ["@changesets/changelog-github", { "repo": "radandevist/radan-ui" }],
	"commit": false,
	"access": "public",
	"baseBranch": "main",
	"updateInternalDependencies": "patch"
}
```
- [ ] **Step 2:** `release.yml`:
```yaml
name: Release
on:
  push:
    branches: [main]
concurrency: release-${{ github.ref }}
permissions:
  contents: write
  pull-requests: write
  id-token: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with: { node-version: 24, cache: pnpm, registry-url: 'https://registry.npmjs.org' }
      - run: npm i -g npm@latest
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
          version: pnpm changeset version
          title: 'chore: version packages'
          commit: 'chore: version packages'
          createGithubReleases: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
  (No `NPM_TOKEN`: npm Trusted Publishing uses the `id-token` OIDC grant; provenance comes from `publishConfig`.)
- [ ] **Step 3:** `changeset-check.yml` — on `pull_request`, fails when files under `src/`, `lint/`, `package.json`
  changed and no new `.changeset/*.md` exists, unless the PR has the label `no-changeset`:
```yaml
name: Changeset
on:
  pull_request:
    types: [opened, synchronize, labeled, unlabeled]
jobs:
  changeset:
    if: ${{ !contains(github.event.pull_request.labels.*.name, 'no-changeset') }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with: { fetch-depth: 0 }
      - run: |
          base=${{ github.event.pull_request.base.sha }}
          if git diff --name-only $base HEAD | grep -qE '^(src/|lint/|package\.json$)'; then
            git diff --name-only --diff-filter=A $base HEAD | grep -qE '^\.changeset/.+\.md$' \
              || { echo "This PR changes the package: add a changeset (npx changeset)."; exit 1; }
          fi
```
  Add `changeset` to the required status checks of `main`.
- [ ] **Step 4:** `.changeset/initial-release.md`:
```md
---
'@radandevist/radan-ui': minor
---

First release: the prefixed theme (`theme.css`, `generateThemeCss`, `radan-ui theme --prefix`), the shared OxLint/oxfmt
config with the generic house rules, and the docs.
```
- [ ] **Step 5:** Commit `ci: changesets release flow with npm trusted publishing`, PR.

---

### Task 6: Docs — the visual language and the front-end rules

**Files:**
- Create: `docs/DESIGN.md`, `docs/rules/visual-consistency.md`, `docs/rules/composition.md`,
  `docs/rules/skeletons.md`, `docs/rules/mobile-native.md`, `docs/rules/forms-in-drawer.md`, `docs/rules/motion.md`,
  `docs/rules/README.md`

- [ ] **Step 1:** `docs/DESIGN.md`: restructure PublyApp `DESIGN.md` (sections: identity-free principles, tokens,
  light/dark, density, radius/shadow, status tones, typography, motion, accessibility), with every value replaced by
  the token name from Task 2 (`--radan-ui-*`) and ShopKartOS values; remove anything PublyApp-specific (brand mark,
  product copy, file paths of the app).
- [ ] **Step 2:** `docs/rules/*.md`: generic versions of ShopKartOS `docs/guides/{mobile-native,forms-in-drawer,motion}.md`,
  the visual-consistency and composition/Compound Components rules (from ShopKartOS AGENTS.md HARD lines and PublyApp
  `docs/guides/front/conventions.md`), and `skeletons.md` (one skeleton library, per-component skeletons beside each
  component, one bone per real element). No app paths, no app names. `docs/rules/README.md` lists them, one line each,
  in the "Binding rules (HARD)" style, ready to be linked from an app's AGENTS.md as
  `node_modules/@radandevist/radan-ui/docs/rules/<file>.md`.
- [ ] **Step 3:** Commit `docs: design language and front-end rules`, PR (label `no-changeset` is wrong here: `docs/`
  ships in the package → add a patch changeset "docs: …").

---

### Task 7: Catalog (Vite) + visual regression + GitHub Pages

**Files:**
- Create: `catalog/index.html`, `catalog/main.tsx`, `catalog/app.css`, `catalog/tokens-page.tsx`,
  `catalog/vite.config.ts`, `catalog/tests/visual.spec.ts`, `playwright.config.ts`, `.github/workflows/pages.yml`
- Modify: `package.json` (scripts `catalog:dev`, `catalog:build`, `test:visual`), `.github/workflows/ci.yml`

- [ ] **Step 1:** `pnpm add -D vite @vitejs/plugin-react @tailwindcss/vite tailwindcss react react-dom @types/react @types/react-dom @playwright/test`.
  `catalog/app.css`: `@import 'tailwindcss' source('../');` then `@import '../dist/theme.css';`
  `@custom-variant dark (&:is(.dark *));`.
- [ ] **Step 2:** `catalog/tokens-page.tsx`: a page that lists every palette, semantic and component token as a swatch
  (`bg-(--radan-ui-<name>)`, its name and value), the radius scale (`rounded-sm`…`rounded-4xl`, `rounded-card`…),
  the shadows, and the status tones as pills; a toggle adds/removes `.dark` on `<html>`; the page reads `?theme=dark`
  so tests can open it in dark directly.
- [ ] **Step 3:** `catalog/tests/visual.spec.ts`: for `theme` in light/dark and viewport in 390×844 / 1440×900, open
  the built catalog and `expect(page).toHaveScreenshot()` (full page). `playwright.config.ts` serves `catalog/dist`
  with `vite preview`. First run creates the baselines (`--update-snapshots`), committed.
- [ ] **Step 4:** CI job `visual` (needs `check`): `npx playwright install --with-deps chromium && npm run catalog:build && npm run test:visual`,
  uploads the diff report on failure.
- [ ] **Step 5:** `pages.yml`: on `release: published` and manual dispatch — build the catalog with
  `--base /radan-ui/`, `actions/upload-pages-artifact`, `actions/deploy-pages` (permissions `pages: write`,
  `id-token: write`). Enable Pages (source: GitHub Actions) with
  `gh api -X POST repos/radandevist/radan-ui/pages -f build_type=workflow`.
- [ ] **Step 6:** Commit `feat(catalog): tokens catalog, visual regression, Pages deploy`, PR with the captures.

---

### Task 8: Maintainer runbook + skill

**Files:**
- Create: `.ai/maintainer.md` (repo) and `~/.claude/skills/radan-ui-maintainer/SKILL.md` (same content, frontmatter
  `name: radan-ui-maintainer`, description with triggers « radan-ui », « librairie UI », « release », « bump », « changeset »,
  « publie la librairie », « mets à jour radan-ui dans ShopKartOS/PublyApp »).

- [ ] **Step 1:** Write the runbook, one section each, exact commands:
  add a component (folder, compound parts, skeleton beside it, tests, catalog page, changeset minor);
  write a changeset (bump rules from spec §7, user-facing wording, migration snippet for breaking);
  review a "Version packages" PR (CHANGELOG reads well, bump type right, captures attached for visual changes);
  cut a major (collect deprecations, migration guide in the release notes);
  deprecate (dev warning + note, removal next major);
  hotfix a published version (branch from tag `vX.Y.Z`, patch changeset, release; `npm deprecate` a broken version);
  bump the apps (one PR per app: `npm i @radandevist/radan-ui@x.y.z`, run the app's verify + visual captures, never
  both apps in one go);
  security report handling (private advisory → fix → patch release → publish advisory).
- [ ] **Step 2:** Commit `docs: maintainer runbook`, PR (`no-changeset`: `.ai/` is not shipped).

---

### Task 9: First publish v0.1.0 (captain + Radan)

npm Trusted Publishing can only be configured on a package that exists, so the very first publish is manual.

- [ ] **Step 1 (Radan, guided by the captain):** on the machine, `npm login` (account `radandevist`), then from a clean
  checkout of `main`: `npx changeset version` (→ 0.1.0 + CHANGELOG), PR + merge, then
  `pnpm check && npm publish --provenance=false` (provenance needs CI the first time) — or the captain does the same
  with a short-lived granular token Radan creates and deletes right after.
- [ ] **Step 2 (Radan):** on npmjs.com → package `@radandevist/radan-ui` → Settings → Trusted Publisher → GitHub
  Actions: owner `radandevist`, repo `radan-ui`, workflow `release.yml`. Then Settings → Publishing access →
  "Require two-factor authentication and disallow tokens".
- [ ] **Step 3 (captain):** create the `v0.1.0` tag + GitHub Release from the CHANGELOG entry; run `pages.yml`; check
  `npm view @radandevist/radan-ui` shows 0.1.0 and the catalog URL answers 200.
- [ ] **Step 4 (captain):** proof of the automated path: a tiny docs patch PR with a changeset → "Version packages" PR →
  merge → 0.1.1 published by CI **with provenance** (`npm view @radandevist/radan-ui@0.1.1 dist.attestations` non-empty),
  tag and GitHub Release created by the action.
- [ ] **Step 5:** Tell PB new (PublyApp captain) the package, the docs paths and the runbook; phase 2 plan (components)
  starts.

---

## Self-review

- Spec coverage: public repo + Apache-2.0 + npm name (T1, T9); prefix configurable, default `radan-ui` (T2); 3 layers
  overridable (T2 + README Overrides); lint/format shared (T3); build for any consumer, publint/attw/size (T4);
  semver + Changesets + Trusted Publishing + GitHub Releases + notes (T5, T9); deprecation policy + maintainer skill
  (T8); docs travel with the library (T6); catalog + visual regression + Pages (T7); hygiene + Renovate + branch
  protection + private vulnerability reporting (T1). Components, skeleton library, app migration = phase 2/3 plans
  (out of scope here, per the spec's rollout).
- Names used across tasks: `generateThemeCss`, `DEFAULT_PREFIX`, `palette`/`semantic`/`component`/`tailwindColors`,
  `dist/theme.css`, scripts `check`/`build`/`build:theme`/`check:package`/`size`/`test:visual` — consistent.
