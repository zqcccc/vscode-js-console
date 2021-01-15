import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const insertLogStatement = vscode.commands.registerCommand(
    'extension.insertLogStatement',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage(
          'Please open your editor window (至少得打开一个编辑窗口吧)'
        );
        return;
      }

      const selections = editor.selections;
      const texts = selections
        .map((i) => editor.document.getText(i))
        .map((text) =>
          text ? `console.log('${text}: ', ${text});` : 'console.log();'
        );
      vscode.commands
        .executeCommand('editor.action.insertLineAfter')
        .then(() => {
          editor.edit((editBuilder) => {
            const newSelections = editor.selections;
            if (newSelections.length > 0) {
              newSelections.forEach((selection, i) => {
                const text = texts[i];
                const range = new vscode.Range(selection.start, selection.end);
                editBuilder.replace(range, text);
              });
            }
          });
        });
    }
  );
  context.subscriptions.push(insertLogStatement);

  let disposable = vscode.commands.registerCommand(
    'extension.deleteAllLogStatements',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage(
          'Please open your editor window (至少得打开一个编辑窗口吧)'
        );
        return;
      }

      const document = editor.document;
      const documentText = editor.document.getText();
      let workspaceEdit = new vscode.WorkspaceEdit();
      const logStatements = getAllLogStatements(document, documentText);
      deleteFoundLogStatements(workspaceEdit, document.uri, logStatements);
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function getAllLogStatements(
  document: vscode.TextDocument,
  documentText: string
): vscode.Range[] {
  let logStatements = [];

  const logRegex = /console.(log|debug|info|warn|error|assert|dir|dirxml|trace|group|groupEnd|time|timeEnd|profile|profileEnd|count)\((.*)\);?/g;
  let match;
  while ((match = logRegex.exec(documentText))) {
    let matchRange = new vscode.Range(
      document.positionAt(match.index),
      document.positionAt(match.index + match[0].length)
    );
    if (!matchRange.isEmpty) {
      logStatements.push(matchRange);
    }
  }
  return logStatements;
}

function deleteFoundLogStatements(
  workspaceEdit: vscode.WorkspaceEdit,
  docUri: vscode.Uri,
  logs: vscode.Range[]
) {
  logs.forEach((log) => {
    workspaceEdit.delete(docUri, log);
  });

  vscode.workspace.applyEdit(workspaceEdit).then(() => {
    logs.length > 1
      ? vscode.window.showInformationMessage(
          `${logs.length} console.logs deleted(${logs.length}条 JS log 被删除)`
        )
      : vscode.window.showInformationMessage(
          `${logs.length} console.log deleted(${logs.length}条 JS log 被删除)`
        );
  });
}
