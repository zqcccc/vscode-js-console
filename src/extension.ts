import * as vscode from 'vscode'

const colorList = [
  '#19E99',
  '#A8978E',
  '#7D8590',
  '#BAAC9A',
  '#C5B37A',
  '#9E9689',
  '#CECAC1',
  '#EDD8AB',
  '#5A4E52',
  '#83978C',
  '#F7BC99',
  '#553E2E',
  '#B79981',
  '#C5C4BC',
  '#404B5D',
  '#B1722D',
  '#42b983',
  '#33A5FF',
  '#B03734',
  '#2EAFB0',
  '#6EC1C2',
  '#ED9EC7',
  '#FCA650',
  '#3F7CFF',
  '#93C0A4',
  '#EA7E5C',
  '#F5CE50',
  '#465975',
  '#FFDD4D',
  '#7F2B82',
  '#4b4b4b',
  '#E41A6A',
]

export function activate(context: vscode.ExtensionContext) {
  const insertLogStatement = vscode.commands.registerCommand(
    'extension.insertLogStatement',
    generateLogCommandFn('node')
  )

  const insertBrowserLogStatement = vscode.commands.registerCommand(
    'extension.insertBrowserLogStatement',
    generateLogCommandFn('browser')
  )
  context.subscriptions.push(insertLogStatement)
  context.subscriptions.push(insertBrowserLogStatement)

  let disposable = vscode.commands.registerCommand(
    'extension.deleteAllLogStatements',
    () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        vscode.window.showInformationMessage(
          'Please open your editor window (至少得打开一个编辑窗口吧)'
        )
        return
      }

      const document = editor.document
      const documentText = editor.document.getText()
      let workspaceEdit = new vscode.WorkspaceEdit()
      const logStatements = getAllLogStatements(document, documentText)
      deleteFoundLogStatements(workspaceEdit, document.uri, logStatements)
    }
  )

  context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
export function deactivate() {}

function generateLogCommandFn(type = 'node'): (...args: any[]) => any {
  return () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showInformationMessage(
        'Please open your editor window (至少得打开一个编辑窗口吧)'
      )
      return
    }

    const selections = editor.selections
    const texts = selections.map((i) => editor.document.getText(i))
    // .map((text) =>
    //   text ? `console.log('${text}: ', ${text});` : 'console.log();'
    // );
    vscode.commands.executeCommand('editor.action.insertLineAfter').then(() => {
      editor.edit((editBuilder) => {
        const newSelections = editor.selections
        if (newSelections.length > 0) {
          newSelections.forEach((selection, i) => {
            const text = texts[i]
            const logToInsert = generateLogStatements(text, type)
            const range = new vscode.Range(selection.start, selection.end)
            editBuilder.replace(range, logToInsert)
          })
        }
      })
    })
  }
}

function generateLogStatements(selectText: string, type = 'node'): string {
  let logToInsert = 'console.log()'

  if (type === 'node') {
    if (selectText) {
      const str = `${selectText}`.replace(/\'|\"/g, '')
      logToInsert = `console.log('${str}: ', ${str})`
    }
  } else if (type === 'browser') {
    if (selectText) {
      const colorIndex = Math.floor(Math.random() * colorList.length)
      const style = `font-size:12px;background-color: ${colorList[colorIndex]};color:#fff;`
      const str = `${selectText}`.replace(/\'|\"/g, '')
      // console.log('str: ', str)
      logToInsert = `console.log('%c ${str}: ', '${style}', ${selectText})`
    }
  }
  return logToInsert
}

function getAllLogStatements(
  document: vscode.TextDocument,
  documentText: string
): vscode.Range[] {
  let logStatements = []

  const logRegex = /console.(log|debug|info|warn|error|assert|dir|dirxml|trace|group|groupEnd|time|timeEnd|profile|profileEnd|count)\((.*?)\);?/g
  let match
  while ((match = logRegex.exec(documentText))) {
    let matchRange = new vscode.Range(
      document.positionAt(match.index),
      document.positionAt(match.index + match[0].length)
    )
    if (!matchRange.isEmpty) {
      logStatements.push(matchRange)
    }
  }
  return logStatements
}

function deleteFoundLogStatements(
  workspaceEdit: vscode.WorkspaceEdit,
  docUri: vscode.Uri,
  logs: vscode.Range[]
) {
  logs.forEach((log) => {
    workspaceEdit.delete(docUri, log)
  })

  vscode.workspace.applyEdit(workspaceEdit).then(() => {
    logs.length > 1
      ? vscode.window.showInformationMessage(
          `${logs.length} console.logs deleted(${logs.length}条 JS log 被删除)`
        )
      : vscode.window.showInformationMessage(
          `${logs.length} console.log deleted(${logs.length}条 JS log 被删除)`
        )
  })
}
