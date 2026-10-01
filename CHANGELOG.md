# Change Log

All notable changes to this project will be documented in this file.

## [0.1.2] - 2026-10-01

### Changed

- New extension icon: a white folder with an amber lightning bolt on a purple rounded tile.
- Directory entries are now listed alphabetically by default, so files are visible right away even in folders that contain mostly folders (e.g. the home directory). Set `quickOpenFiles.listDirsFirst` to `true` to restore folder-first ordering.

### Fixed

- The filter typed into the picker is now cleared when navigating into a folder; previously the stale filter silently hid most entries of the new listing.
- Wildcard exclusion patterns now match dotfile names (e.g. `**/*.pyc` also hides `.hidden.pyc`), matching the semantics of VS Code's own glob used by `files.exclude`.
- `~\` (Windows-style separator) in bookmarks now expands to the home directory, like `~/` always has.
- Exclusion patterns with surrounding whitespace now work, matching VS Code's glob preprocessing.
- `files.exclude` fallback now also applies when the editor reports `quickOpenFiles.excludePatterns` as an empty array instead of `undefined` (observed in some VS Code forks), while an explicitly configured empty array still disables the fallback.
- Design proposals under `icon-proposals/` are no longer packaged into the VSIX.

## [0.1.1] - 2026-08-31

### Changed

- List items now show a single line (the entry name); the absolute path is no longer displayed as a second line.
- The picker now closes after opening a file by default. Set `quickOpenFiles.persistentBrowsing` to `true` to keep it open for continuous browsing.

### Fixed

- `files.exclude`-style patterns with `**` segments (e.g. `**/node_modules/**`) now work in `excludePatterns` and in the `files.exclude` fallback; previously only bare-name patterns matched.
- Rapid navigation no longer lets a stale directory listing overwrite the current view.
- The current-directory listing is skipped for untitled or non-file editors instead of showing an unrelated folder.
- Fixed the extension ID used by the integration tests so `npm run test:integration` passes.
- Dev config files (`vitest.config.ts`, `.vscode-test.mjs`, `scripts/`) are no longer included in the packaged VSIX.

## [0.1.0] - 2026-08-31

### Added

- `Quick Open Files: Browse Files…` command (`Cmd+Alt+O` / `Ctrl+Alt+O`) with a cascading QuickPick file browser.
- Configurable bookmarks (`quickOpenFiles.bookmarks`) with `~` expansion and missing-path warnings.
- Persistent browsing: the picker stays open after opening a file.
- Current-directory listing for the active editor, with `../` and back-button navigation.
- Folder-first sorting and exclusion patterns (falls back to `files.exclude`).
