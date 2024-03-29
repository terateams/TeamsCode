/* eslint-disable no-unused-vars */
// @ts-nocheck
const vscode = require("vscode");
const getNewPosition = require("./common").getNewPosition;
const smartSummaries = require("./apis").smartSummaries;

/**
 * @param {vscode.ExtensionContext} context
 */
async function summariesCommand(context) {
    let cancel = false;
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = "Summaries Prompts..."
    quickPick.placeholder = 'Please enter a prompt';

    quickPick.onDidAccept(async () => {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "TeamsCode Summary...",
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
                    const selectedText = editor.document.getText(selection);
                    let insertPosition = selection.isEmpty ? selection.active : selection.end;
                    const completion = await smartSummaries(selectedText, value);

                    const startText = "\n\nSummary: ";
                    await editor.edit(editBuilder => {
                        editBuilder.insert(insertPosition, startText);
                    });
                    insertPosition = getNewPosition(insertPosition, startText);

                    for await (const chunk of completion) {
                        if (cancel) {
                            console.log('Operation cancelled by the user.');
                            break;
                        }
                        const newText = chunk.content;
                        if (!newText) {
                            continue;
                        }
                        await editor.edit(editBuilder => {
                            editBuilder.insert(insertPosition, newText);
                        });
                        insertPosition = getNewPosition(insertPosition, newText);
                    }
                    await editor.edit(editBuilder => {
                        editBuilder.insert(insertPosition, "\n\n");
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
    summariesCommand
};