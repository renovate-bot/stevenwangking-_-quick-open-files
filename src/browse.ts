import * as vscode from 'vscode';
import { dirname } from 'node:path';
import { QuickInputButtons, QuickPickItemKind, Uri } from 'vscode';
import { bookmarkEntries, currentDirOf, dirEntries, FileEntry } from './filesList';
import { getSettings, Settings } from './settings';

interface BrowseItem extends vscode.QuickPickItem {
  entry?: FileEntry;
}

export class BrowseSession {
  private readonly qp = vscode.window.createQuickPick<BrowseItem>();
  /** Guards against stale async directory reads overwriting a newer view. */
  private generation = 0;
  private currentDir: string | undefined;

  constructor(private readonly settings: Settings) {
    this.qp.ignoreFocusOut = true;
    this.qp.onDidAccept(this.onAccept, this);
    this.qp.onDidTriggerButton(this.onTriggerButton, this);
    this.qp.onDidHide(() => this.qp.dispose());
  }

  start(): void {
    // Read the active editor before qp.show() moves focus away — once the
    // QuickPick is open, window.activeTextEditor can report undefined.
    void this.showRoot(vscode.window.activeTextEditor?.document.uri);
    this.qp.show();
  }

  private async showRoot(activeDoc: vscode.Uri | undefined): Promise<void> {
    const gen = ++this.generation;
    this.currentDir = undefined;
    this.qp.buttons = [];
    this.qp.title = undefined;
    this.qp.placeholder = 'Filter files and folders';
    this.qp.busy = true;
    // Load bookmarks and the current directory together; they are independent.
    // Bookmarks are skipped entirely when hidden: no section, no fs checks.
    const bookmarksPromise = this.settings.listBookmarks
      ? bookmarkEntries(this.settings.bookmarks)
      : Promise.resolve([]);
    // currentDirOf skips untitled/remote documents, whose fsPath has no real folder.
    const dir = this.settings.listCurrentDir ? currentDirOf(activeDoc) : undefined;
    const entriesPromise: Promise<FileEntry[]> = dir ? this.listDir(dir, gen) : Promise.resolve([]);
    const bookmarks = await bookmarksPromise;

    const items: BrowseItem[] = [];
    if (this.settings.listBookmarks) {
      items.push({ label: 'Bookmarks', kind: QuickPickItemKind.Separator });
      items.push(...bookmarks.map(toItem));
    }
    if (dir) {
      items.push({ label: dir, kind: QuickPickItemKind.Separator });
      items.push(...(await entriesPromise).map(toItem));
    }

    if (gen !== this.generation) {
      return; // a newer view took over while we were loading
    }
    this.qp.busy = false;

    const missing = bookmarks.filter((b) => !b.exists).map((b) => b.path);
    if (missing.length > 0) {
      vscode.window.showWarningMessage(`Quick Open Files: bookmark not found: ${missing.join(', ')}`);
    }
    this.qp.items = items;
  }

  private async showDir(dir: string): Promise<void> {
    const gen = ++this.generation;
    this.currentDir = dir;
    this.qp.buttons = [QuickInputButtons.Back];
    this.qp.title = dir;
    // Clear the filter typed for the previous listing; QuickPick keeps it
    // across item changes, which would silently hide most of the new entries.
    this.qp.value = '';
    this.qp.busy = true;
    const entries = await this.listDir(dir, gen);
    if (gen !== this.generation) {
      return; // a newer view took over while we were loading
    }
    this.qp.busy = false;
    this.qp.items = entries.map(toItem);
  }

  /** Read a directory; failures of a view already replaced are not reported. */
  private async listDir(dir: string, gen: number): Promise<FileEntry[]> {
    try {
      return await dirEntries(dir, this.settings.excludePatterns, this.settings.listDirsFirst);
    } catch (err) {
      if (gen === this.generation) {
        vscode.window.showErrorMessage(`Quick Open Files: cannot read ${dir} (${errorMessage(err)})`);
      }
      return [];
    }
  }

  private onTriggerButton(button: vscode.QuickInputButton): void {
    if (button === QuickInputButtons.Back && this.currentDir) {
      void this.showDir(dirname(this.currentDir));
    }
  }

  private onAccept(): void {
    const picked = this.qp.selectedItems[0];
    if (!picked?.entry) {
      return;
    }
    const entry = picked.entry;
    if (!entry.exists) {
      void vscode.window.showErrorMessage(`Quick Open Files: path does not exist: ${entry.path}`);
      return;
    }
    if (entry.isDir) {
      void this.showDir(entry.path);
      return;
    }
    void this.openFile(entry.path);
  }

  private async openFile(path: string): Promise<void> {
    try {
      await vscode.window.showTextDocument(Uri.file(path), {
        preview: true,
        preserveFocus: this.settings.persistentBrowsing,
      });
    } catch (err) {
      void vscode.window.showErrorMessage(`Quick Open Files: cannot open ${path} (${errorMessage(err)})`);
    }
    if (this.settings.persistentBrowsing) {
      await this.showDir(dirname(path));
    } else {
      this.qp.hide();
    }
  }
}

function toItem(entry: FileEntry): BrowseItem {
  return {
    label: entry.exists ? entry.label : `${entry.label} (not found)`,
    entry,
  };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Entry point of the `quickOpenFiles.browse` command. */
export function browse(): void {
  new BrowseSession(getSettings()).start();
}
