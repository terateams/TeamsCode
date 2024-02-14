const vscode = require("vscode");
const getNewPosition = require("./common").getNewPosition;
const smartWriting = require("./apis").smartWriting;

/**
 * @param {vscode.ExtensionContext} context
 */
async function writingCommand(context){
    let cancel = false;
    const quickPick = vscode.window.createQuickPick();
    const withNoteLabel = "Writing with note";
    const feynmanStyle =
        "Writing Style: Sharp, Humorous, Insightful, Rebellious";
    const xiaoboStyle =
        "Writing Style: Intuitive, Humorous, Passionate, Creative";
    const slideWrite = "Generate slide content";
    quickPick.title = "Writing Prompts..."
    quickPick.placeholder = "Please enter a writing prompt";
    quickPick.canSelectMany = true; // 允许多选
    quickPick.items = [
        { label: withNoteLabel, alwaysShow: true }, // 特殊项用于确认选择
        { label: feynmanStyle, alwaysShow: true }, // 费曼风格：直观，幽默，激情
        { label: xiaoboStyle, alwaysShow: true }, // 王小波风格：犀利，幽默，深刻
        { label: slideWrite, alwaysShow: true }, // 生成幻灯片内容
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

        let writeStyle = "";
        if (
            quickPick.selectedItems.find(
                (item) => item.label == feynmanStyle
            ) !== undefined
        ) {
            writeStyle = feynmanStyle;
        }

        let slideContent = false;
        if (
            quickPick.selectedItems.find(
                (item) => item.label == slideWrite
            ) !== undefined
        ) {
            slideContent = true;
        }

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            try {
                cancel = false;
                const selection = editor.selection;
                const selectedText = editor.document.getText(selection);
                let insertPosition = selection.isEmpty
                    ? selection.active
                    : selection.end;
                const beforeText = editor.document.getText(
                    new vscode.Range(new vscode.Position(0, 0), selection.start)
                );
                const afterText = editor.document.getText(
                    new vscode.Range(
                        selection.end,
                        new vscode.Position(editor.document.lineCount, 0)
                    )
                );

                quickPick.busy = true;
                const completion = await smartWriting(
                    beforeText,
                    afterText,
                    selectedText,
                    value,
                    notes,
                    writeStyle,
                    slideContent
                );
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
    writingCommand
};