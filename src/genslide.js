const vscode = require("vscode");
const getNewPosition = require("./common").getNewPosition;
const smartGenMarpSlide = require("./apis").smartGenMarpSlide;

/**
 * @param {vscode.ExtensionContext} context
 */
async function genslideCommand(context) {
    const withNoteLabel = "Writing with note";
    let cancel = false;
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = "Writing Slide Prompts..."
    quickPick.placeholder = "Please enter a slide prompt";
    quickPick.canSelectMany = true; // 允许多选
    quickPick.items = [
        { label: withNoteLabel, alwaysShow: true }, // 特殊项用于确认选择
    ];

    quickPick.onDidHide(() => (cancel = true));
    quickPick.onDidAccept(async () => {
        const withNote =
            quickPick.selectedItems.find(
                (item) => item.label == withNoteLabel
            ) !== undefined;
        const value = quickPick.value;
        let notes = [];
        if (withNote) {
            notes = context.globalState.get("coolwriter.notes", []);
        }

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            try {
                cancel = false;
                let insertPosition = new vscode.Position(0, 0); // 设置插入位置为文档开始位置

                quickPick.busy = true;
                const completion = await smartGenMarpSlide(value, notes);
                for await (const chunk of completion) {
                    if (cancel) {
                        console.log("Operation cancelled by the user.");
                        break;
                    }
                    const newText = chunk.content;
                    if(!newText){
                        continue;
                    }
                    await editor.edit((editBuilder) => {
                        editBuilder.insert(insertPosition, newText);
                    });
                    insertPosition = getNewPosition(insertPosition, newText);
                }
                await editor.edit((editBuilder) => {
                    editBuilder.insert(insertPosition, "\n\n");
                });
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
    genslideCommand
};