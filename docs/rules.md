# Valet Project Rules

This document defines core rules for documentation, code, and user experience design.

---

## 1. Documentation Rules (ASD-STE100)

Apply Simplified Technical English to all markdown files and code docstrings:

- **Sentence Length:** Keep sentences under 20 words.
- **Voice:** Use active voice. Do not use passive voice.
- **Tense:** Use present tense.
- **Word Choice:** Use simple, direct words. Do not use complex synonyms or jargon.
- **Docstrings:** State exactly what the function does for the system.
- **Docstring Example:** `// Changes pending sqlite-vec embeddings to plain text for the LLM.`
- **Documentation Currency:** Keep all documentation files, including `docs/todo.md` and `docs/completed.md`, up to date at all times.

---

## 2. Engineering and Code Rules

- **Process Boundaries:** Maintain strict isolation between `gatherer`, `agent`, and `ui`.
- **No Shared Memory:** Never share memory across PM2 processes. All communication flows through SQLite.
- **Decoupled Latent Spaces:** Never pass raw embeddings into the generative LLM. Convert vector matches to plain text first.
- **Database Concurrency:** Always use `PRAGMA journal_mode = WAL;` and `PRAGMA busy_timeout = 5000;`.
- **Type Safety:** Validate all database rows and LLM JSON outputs with Zod schemas.
- **Monorepo Avoidance:** Maintain a single root `package.json`. Avoid workspace sub-packages.
- **Database Migrations:** Record all schema alterations in `src/db/migrations.ts`. Track migrations in `_schema_migrations`.
- **API Error Handling:** Wrap Express route handlers in try/catch blocks. Return standard JSON payloads with accurate status codes.
- **Testing Standards:** Maintain automated test suites for utility functions, algorithms, and endpoints. Run tests with `npm test`.

---

## 3. UX and Product Design Rules

Valet follows a strict design token system defined in `src/ui/tokens.css`.

### Design Tokens Architecture
- **Tier 1 (Primitives):** Define raw scales for color, spacing, radii, and typography.
- **Tier 2 (Semantics):** Map surfaces, foregrounds, borders, and brand accents for light and dark themes.
- **Tier 3 (Components):** Define layout widths like feed (`720px`) and dashboard (`1480px`).

### Visual and Interaction Principles
- **Design Tokens First:** Never hardcode raw hex values or pixel sizes in component styles. Use CSS variables.
- **Accessibility Baseline:** Maintain WCAG AA contrast (4.5:1 for text, 3:1 for controls).
- **Theme Support:** Support both light and dark modes through semantic CSS variables.
- **Information Hierarchy:** Surface high-signal intelligence first. Keep clutter and decoration minimal.
- **Immediate Feedback:** Show loading states, progress bars, and clear confirmation for every action.
- **Typography Scannability:** Use clean sans-serif type with proportional line heights for easy reading.

---

## 4. Component Hierarchy and Naming Rules (Atomic 5-Layer Parity)

All components must maintain strict 1:1 name parity across five architectural layers:
1. Storybook title and navigation.
2. File system path and file name.
3. TypeScript component symbol and interface.
4. HTML root element class and identifier.
5. CSS class rules and selectors.

### 4.1. The Atomic Design Hierarchy
Every UI component belongs to one exact tier:
- **Tokens (`Tokens/*`):** Raw scales and semantic design tokens. Story suites include `Colors`, `Typography`, `Spacing`, `Radii & Shadows`, `Timing & Motion`, and `Contrast & Accessibility`.
- **Primitives (`Primitives/*`):** Indivisible atoms and basic controls. Examples include `Badge`, `BotAvatar`, `Button`, `Card`, `Input`, `Modal`, `Select`, `StageHoldRunButton`, `Textarea`, and `Toggle`.
- **Combined Components (`Combined Components/*`):** Molecules functioning as lightweight composite controls. They follow three strict rules:
  1. *State:* State is "dumb". It relies on props passed down and emits events up. It only holds local UI state.
  2. *Layout:* Layout-agnostic. It stretches or shrinks to fit parent containers without external spatial control.
  3. *Coupling:* Universally reusable and domain-agnostic. Examples include `ArticlePagination`, `FontSizeToggle`, `HeaderTokenBadge`, `LayoutSwitcher`, `NotificationBanner`, `PauseToggle`, `PillToggle`, `SourceBadge`, `ThemeToggle`, and `VoteControl`.
- **Complex Components (`Complex Components/*`):** Organisms operating as mini-layouts. They follow three strict rules:
  1. *State:* State is "smart". It coordinates complex internal workflows, data fetching, or business logic.
  2. *Layout:* Layout-dictatorial. It operates as a sub-layout, dictating internal flex/grid zones and slots.
  3. *Coupling:* Feature-specific and domain-specific. Examples include `FeedCard`, `FeedFilterBar`, `MetricCard`, and `PipelineTableRow`. Other examples include `SourceItemRow`, `SuggestedSourceRow`, and `TokenCostModal`.
- **Layouts (`Layouts/*`):** Macro-layouts and full-screen shells (`AppHeader`, `NavigationSidebar`, `AgentPageHeader`, `AgentTabs`, `CommandCenter`, `FeedView`, `ReaderPage`).

### 4.2. Strict Naming and Parity Rules
1. **Canonical Component Name:**
   - Use PascalCase for the component name: `<ComponentName>`.
   - The file name must match the component name exactly: `<ComponentName>.tsx`.
   - The story file must match the component name exactly: `<ComponentName>.stories.tsx`.
   - The main export must match the component name: `export function <ComponentName>(...)`.
   - The props interface must match the component name: `export interface <ComponentName>Props`.

2. **Storybook Title Rule:**
   - The story `title` must equal `<AtomicTier>/<ComponentName>`.
   - Examples: `Primitives/Button`, `Combined Components/MetricCard`, `Complex Components/FeedCard`, `Layouts/AppHeader`.
   - Never append descriptive suffixes to the story title (e.g. use `Primitives/Input`, not `Primitives/Input & Form Controls`).

3. **HTML Root Class Rule:**
   - The root DOM element rendered by the component must include a predictable kebab-case class: `.<kebab-name>`.
   - For components with container wrappers, use `.<kebab-name>-wrapper` or `.<kebab-name>-container`.
   - Examples:
     - `<FeedCard>` must render `.feed-card` or `.feed-card-wrapper`.
     - `<AppHeader>` must render `.app-header`.
     - `<NavigationSidebar>` must render `.navigation-sidebar`.
     - `<FeedView>` must render `.feed-view`.
     - `<CommandCenter>` must render `.command-center`.
     - `<ReaderPage>` must render `.reader-page`.
     - `<Button>` must render `.valet-button` (or `.valet-btn`).
   - If an element needs an HTML `id`, use `#<kebab-name>` or `#<kebab-name>-<id>`.

4. **File System Location Rule:**
   - Stories must sit directly adjacent to their target component in a `__stories__/` folder.
   - Example: `src/ui/components/feed/FeedCard.tsx` has story `src/ui/components/feed/__stories__/FeedCard.stories.tsx`.
   - Design token stories must reside in `src/ui/tokens/__stories__/`, not inside component directories.

5. **No Mock Components in Stories:**
   - Stories must always import and render the real production component.
   - Never write local mock components (such as `MockPauseToggle` or `MockThemeToggle`) in story files.
   - Components that communicate with backend APIs must accept optional controlled props for Storybook rendering.


