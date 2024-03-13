const vscode = require("vscode");
const getNewPosition = require("./common").getNewPosition;
const smartCoding = require("./apis").smartCoding;

/**
 * @param {vscode.ExtensionContext} context
 */
async function codingCommand(context){
    let cancel = false;
    const quickPick = vscode.window.createQuickPick();
    const withNoteLabel = "Coding with note";
    quickPick.title = "Coding Prompts..."
    quickPick.placeholder = 'Please enter a coding prompt';
    quickPick.canSelectMany = true; // 允许多选
    quickPick.items = [
        {
            label: withNoteLabel, alwaysShow: true,
            detail: "Use the list of currently active notes as a context"
        }, // 使用当前活动笔记列表作为上下文
    ];

    quickPick.onDidHide(() => cancel = true);
    quickPick.onDidAccept(async () => {
        const withNote = quickPick.selectedItems.find(item => item.label == withNoteLabel) !== undefined;
        const value = quickPick.value;
        let notes = [];
        if (withNote) {
            notes = context.globalState.get('coolwriter.notes', []);
        }
    
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            try {
                cancel = false;
                const selection = editor.selection;
                const selectedText = editor.document.getText(selection);
                let insertPosition = selection.isEmpty ? selection.active : selection.end;
                const beforeText = editor.document.getText(new vscode.Range(new vscode.Position(0, 0), selection.start));
                const afterText = editor.document.getText(new vscode.Range(
                    selection.end, new vscode.Position(editor.document.lineCount, 0)
                ));

                quickPick.busy = true;
                const completion = await smartCoding(beforeText, afterText, selectedText, value, notes);
                for await (const chunk of completion) {
                    if (cancel) {
                        console.log('Operation cancelled by the user.');
                        break;
                    }
                    const newText = chunk.content;
                    if(!newText){
                        continue;
                    }
                    await editor.edit(editBuilder => {
                        editBuilder.insert(insertPosition, newText);
                    });
                    insertPosition = getNewPosition(insertPosition, newText);
                }
            } catch (error) {
                console.error(error);
                vscode.window.showErrorMessage(error.message);
            } finally {
                quickPick.busy = false;
                quickPick.hide();
            }
        }
    });
    quickPick.show();
}

module.exports = {
    codingCommand
};