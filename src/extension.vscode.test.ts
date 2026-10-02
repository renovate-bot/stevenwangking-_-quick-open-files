import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { BrowseSession } from './browse';
import { getSettings } from './settings';

/** BrowseSession keeps its QuickPick private; tests reach it through this seam. */
interface SessionInternals {
  qp: vscode.QuickPick<vscode.QuickPickItem>;
  showDir(dir: string): Promise<void>;
}

suite('Quick Open Files extension', () => {
  test('activates and registers the browse command', async () => {
    const ext = vscode.extensions.getExtension('stevenwangking.quick-open-files');
    assert.ok(ext, 'extension should be present');
    await ext.activate();
    assert.ok(ext.isActive, 'extension should be active');

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('quickOpenFiles.browse'), 'browse command should be registered');
  });

  test('browse command runs and opens the QuickPick without errors', async () => {
    // Exercises the full path: getSettings -> bookmarkEntries -> createQuickPick().show()
    await vscode.commands.executeCommand('quickOpenFiles.browse');
    await new Promise((resolve) => setTimeout(resolve, 500));
    // The picker is a UI singleton; close it so the test instance is left clean.
    await vscode.commands.executeCommand('workbench.action.closeQuickOpen');
  });

  test('clears the filter when navigating into a folder', async function () {
    this.timeout(10000);
    const session = new BrowseSession(getSettings());
    try {
      session.start();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const internals = session as unknown as SessionInternals;
      // Call showDir as a method — destructuring it would detach `this`.
      internals.qp.value = 'some-filter'; // simulates typing before pressing Enter on a folder
      await internals.showDir('/');
      assert.strictEqual(internals.qp.value, '', 'filter must be cleared on navigation');
      assert.ok(internals.qp.items.length > 0, 'the new listing should have entries');
    } finally {
      (session as unknown as SessionInternals).qp.hide();
    }
  });

  test('listBookmarks toggles the bookmark section in the root view', async function () {
    this.timeout(10000);
    const hasBookmarkSection = (session: BrowseSession) =>
      (session as unknown as SessionInternals).qp.items.some(
        (item) => item.label === 'Bookmarks' && item.kind === vscode.QuickPickItemKind.Separator,
      );

    const hidden = new BrowseSession({ ...getSettings(), listBookmarks: false });
    try {
      hidden.start();
      await new Promise((resolve) => setTimeout(resolve, 500));
      assert.ok(!hasBookmarkSection(hidden), 'no bookmark section when listBookmarks is false');
    } finally {
      (hidden as unknown as SessionInternals).qp.hide();
    }

    const shown = new BrowseSession({ ...getSettings(), listBookmarks: true });
    try {
      shown.start();
      await new Promise((resolve) => setTimeout(resolve, 500));
      assert.ok(hasBookmarkSection(shown), 'bookmark section appears when listBookmarks is true');
    } finally {
      (shown as unknown as SessionInternals).qp.hide();
    }
  });

  test('empty excludePatterns only counts when explicitly configured', async () => {
    const cfg = vscode.workspace.getConfiguration('quickOpenFiles');
    try {
      await cfg.update('excludePatterns', [], vscode.ConfigurationTarget.Global);
      assert.deepStrictEqual(getSettings().excludePatterns, [],
        'an explicitly empty array must not fall back to files.exclude');

      await cfg.update('excludePatterns', undefined, vscode.ConfigurationTarget.Global);
      const fallback = getSettings().excludePatterns;
      assert.ok(Array.isArray(fallback) && fallback.length > 0,
        'unset should fall back to the default files.exclude patterns');
    } finally {
      await cfg.update('excludePatterns', undefined, vscode.ConfigurationTarget.Global);
    }
  });
});
