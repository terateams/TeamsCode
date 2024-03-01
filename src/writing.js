const vscode = require("vscode");
const getNewPosition = require("./common").getNewPosition;
const smartWriting = require("./apis").smartWriting;

/**
 * @param {any[] | readonly vscode.QuickPickItem[]} items
 * @param {string} label
 * @returns {boolean}
 */
function isSelected(items, label) {
    return items.find((item) => item.label == label) !== undefined;
}

const styles = {
    "Professional writing characteristics": "Professional writing: accuracy, clarity, conciseness, consistency, objectivity, use of specialized terminology, focus on purpose and adaptability to ensure effective communication.",
    "Popular writing qualities": "Popular writing: easy to understand, engaging, approachable, practical, emotive, simplifies complex concepts, addresses a wide audience and aims to make information accessible and understandable to everyone.",
    "Literary writing elements": "Literary writing: Through aesthetic language, creative expression, emotional depth, profound themes, meticulous character development, diverse narrative techniques, and richness of language, aims to provide a unique aesthetic experience that touches the heart and stimulates thought.",
    "Business writing features": "Business writing: Direct, clear, purpose-driven communication that facilitates transactions, marketing, and business-related exchanges.",
    "Journalistic writing attributes": "Journalistic writing: Focused on fact reporting, timeliness, and public interest, aimed at conveying news stories and information.",
    "Creative writing characteristics": "Creative writing: Involves fiction, poetry, scriptwriting, and non-fiction narratives, characterized by imagination, storytelling, and artistic use of language to express personal perspectives, emotions, and creative stories.",
    "Reflective writing qualities": "Reflective writing: Part of personal or professional development, characterized by personal experiences, feelings, and reflections, aimed at fostering self-awareness and growth."
};


/**
 * @param {vscode.ExtensionContext} context
 */
async function writingCommand(context) {
    let cancel = false;
    const quickPick = vscode.window.createQuickPick();
    const withNoteLabel = "Writing with notes";
    const slideWrite = "Generate slide content";
    quickPick.title = "Writing Prompts..."
    quickPick.placeholder = "Please enter a writing prompt";
    quickPick.canSelectMany = true; // 允许多选
    let items = [
        {
            label: withNoteLabel, alwaysShow: true,
        },// 使用当前活动笔记列表作为上下文
        {
            label: slideWrite, alwaysShow: true,
        }, // 生成幻灯片内容
    ];
    for (const key in styles) {
        items.push({ label: key, alwaysShow: true });
    }
    quickPick.items = items;

    quickPick.onDidHide(() => (cancel = true));
    quickPick.onDidAccept(async () => {
        const withNote = isSelected(quickPick.selectedItems, withNoteLabel);
        const value = quickPick.value;
        let notes = [];
        if (withNote) {
            notes = context.globalState.get("coolwriter.notes", []);
        }

        let writeStyles = [];
        for (const style in styles) {
            if (isSelected(quickPick.selectedItems, style)) {
                writeStyles.push(styles[style]);
            }
        }

        if (writeStyles.length > 1) {
            vscode.window.showErrorMessage("Please select only one writing style.");
            return;
        }

        const writeStyle = writeStyles[0] || "";

        let slideContent = false;
        if (isSelected(quickPick.selectedItems, slideWrite)) {
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
                    if (!newText) {
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