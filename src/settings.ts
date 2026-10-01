import * as vscode from 'vscode';

export interface Settings {
  bookmarks: string[];
  persistentBrowsing: boolean;
  listCurrentDir: boolean;
  listDirsFirst: boolean;
  excludePatterns: string[];
}

/** Read settings, falling back to the user's global `files.exclude` for hide patterns. */
export function getSettings(): Settings {
  const cfg = vscode.workspace.getConfiguration('quickOpenFiles');
  return {
    bookmarks: cfg.get<string[]>('bookmarks', ['~']),
    persistentBrowsing: cfg.get('persistentBrowsing', false),
    listCurrentDir: cfg.get('listCurrentDir', true),
    listDirsFirst: cfg.get('listDirsFirst', false),
    // `get()` returns [] instead of undefined for an unset array on some VS Code
    // forks, so detect "explicitly configured" via inspect(); an intentionally
    // empty array must not trigger the files.exclude fallback. Always an array.
    excludePatterns: explicitExcludePatterns(cfg) ?? fallbackExcludePatterns() ?? [],
  };
}

/** The highest-precedence user-set value, or undefined when never configured. */
function explicitExcludePatterns(cfg: vscode.WorkspaceConfiguration): string[] | undefined {
  // window-scope settings cannot be configured per workspace folder, so
  // workspaceFolderValue is always undefined today; kept for forward-compat
  // should the scope ever widen to resource.
  const inspect = cfg.inspect<string[]>('excludePatterns');
  return inspect?.workspaceFolderValue ?? inspect?.workspaceValue ?? inspect?.globalValue;
}

function fallbackExcludePatterns(): string[] | undefined {
  const filesExclude = vscode.workspace
    .getConfiguration('files')
    .get<Record<string, boolean>>('exclude');
  if (!filesExclude) {
    return undefined;
  }
  return Object.entries(filesExclude)
    .filter(([, hidden]) => hidden)
    .map(([pattern]) => pattern);
}
