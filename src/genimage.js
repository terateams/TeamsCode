/* eslint-disable no-unused-vars */
// @ts-nocheck
const vscode = require("vscode");
const genImage = require("./apis").genImage;

/**
 * @param {vscode.ExtensionContext} context
 */
async function imagineCommand(context) {
    let cancel = false;
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = "Imagine Prompts..."
    quickPick.placeholder = 'Please enter a prompt';

    quickPick.onDidAccept(async () => {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "TeamsCode Imagine...",
            cancellable: true,
        }, async (progress, token) => {
            quickPick.hide();
            token.onCancellationRequested(() => {
                cancel = true;
            })
            const value = quickPick.value;
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                try {
                    cancel = false;
                    const selection = editor.selection;
                    let insertPosition = selection.isEmpty ? selection.active : selection.end;
                    const imageUrl = await genImage(value);
                    await editor.edit(editBuilder => {
                        editBuilder.insert(insertPosition, `![${value}](${imageUrl})`);
                    });
                } catch (error) {
                    console.error(error);
                    vscode.window.showErrorMessage(error.message);
                } finally {
                    progress.report({ message: "Done" });
                }
            }
        });
    });
    quickPick.show();
}

module.exports = {
    imagineCommand
};