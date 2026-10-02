# Quick Open Files

[![Install in VS Code](https://img.shields.io/badge/Install-VS%20Code-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=stevenwangking.quick-open-files)

Open files quicker and easier in VS Code: browse your **bookmarks** or **any directory** from a Quick Pick — even outside the current workspace.

Inspired by the classic [sublime-open](https://github.com/danielfrg/sublime-open) plugin for Sublime Text.

## Features

- **Bookmarks (opt-in)**: jump straight to frequently used files and folders, across all workspaces. Set `quickOpenFiles.listBookmarks` to `true` to list them.
- **File system browsing**: drill into any directory with `Enter`, go up with `../` or the `←` back button.
- **Persistent browsing (opt-in)**: set `quickOpenFiles.persistentBrowsing` to keep the picker open after opening a file, so you can keep opening more.
- **Current directory listing**: the active editor's folder is listed right below your bookmarks.
- **Smart ordering and filtering**: entries are listed alphabetically (folders carry a trailing `/`), with an option to list folders first, and your existing `files.exclude` patterns are respected out of the box.

## Usage

Default keyboard shortcut: `Cmd+Alt+O` (macOS) / `Ctrl+Alt+O` (Windows, Linux). Also available as **Quick Open Files: Browse Files…** in the Command Palette.

- Pick a **file** to open it in a preview tab (kept as-is once you edit or pin it).
- Pick a **folder** to browse inside it.

## Extension Settings

| Setting | Default | Description |
|---|---|---|
| `quickOpenFiles.bookmarks` | `["~"]` | Files or folders shown at the top of the picker. `~` expands to your home directory. |
| `quickOpenFiles.listBookmarks` | `false` | List your bookmarks at the top of the picker. |
| `quickOpenFiles.persistentBrowsing` | `false` | Keep the picker open after opening a file. |
| `quickOpenFiles.listCurrentDir` | `true` | List the active editor's folder below the bookmarks. |
| `quickOpenFiles.listDirsFirst` | `false` | List folders before files instead of mixing everything alphabetically. |
| `quickOpenFiles.excludePatterns` | *(falls back to `files.exclude`)* | Glob patterns matched against entry names; `files.exclude`-style patterns such as `**/node_modules/**` also work. |

Example:

```json
{
  "quickOpenFiles.bookmarks": ["~", "~/.ssh/config", "~/projects"],
  "quickOpenFiles.listBookmarks": true,
  "quickOpenFiles.excludePatterns": ["**/node_modules/**", ".DS_Store"]
}
```

## Known limitations

- Opening binary files may show an error notification from VS Code.
- Symlinks to folders are followed and browsed like regular folders.

## Release Notes

Release notes are available in [CHANGELOG.md](CHANGELOG.md).

## License

Released under the [MIT license](LICENSE).
