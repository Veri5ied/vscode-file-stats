import * as vscode from "vscode";
import * as fs from "fs";

export const activateExtension = (context: vscode.ExtensionContext) => {
  let folderCounter = new Map<string, Map<string, number>>();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(() => {
      folderCounter =
        context.globalState.get("folderCounter") ||
        new Map<string, Map<string, number>>();
    })
  );

  vscode.workspace.onDidOpenTextDocument((document) => {
    const filePath = document.uri.fsPath;

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const folderPath = vscode.workspace.getWorkspaceFolder(document.uri)?.uri
        .fsPath;

      if (folderPath) {
        const fileCounts =
          folderCounter.get(folderPath) || new Map<string, number>();
        const count = fileCounts.get(filePath) || 0;
        fileCounts.set(filePath, count + 1);
        updateFileName(filePath, count + 1);
        folderCounter.set(folderPath, fileCounts);
        console.log(`File opened: ${filePath}, Count: ${count + 1}`);
      }
    }
  });

  vscode.workspace.onDidCloseTextDocument((document) => {
    const filePath = document.uri.fsPath;

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const folderPath = vscode.workspace.getWorkspaceFolder(document.uri)?.uri
        .fsPath;

      if (folderPath) {
        const fileCounts =
          folderCounter.get(folderPath) || new Map<string, number>();
        const count = fileCounts.get(filePath) || 0;
        if (count > 1) {
          fileCounts.set(filePath, count - 1);
          updateFileName(filePath, count - 1);
          console.log(`File closed: ${filePath}, Count: ${count - 1}`);
        } else {
          fileCounts.delete(filePath);
          console.log(`File closed and removed from tracking: ${filePath}`);
        }
        folderCounter.set(folderPath, fileCounts);
      }
    }
  });

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(() => {
      context.globalState.update("folderCounter", folderCounter);
    })
  );
};

function updateFileName(filePath: string, count: number) {
  const path = require("path");
  const dirname = path.dirname(filePath);
  const extname = path.extname(filePath);
  const basename = path.basename(filePath, extname);
  const newFileName = `${basename}_(${count})${extname}`;
  const fs = require("fs");
  fs.renameSync(filePath, path.join(dirname, newFileName));
}
