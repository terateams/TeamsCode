const vscode = require("vscode");
const getNewPosition = require("./common").getNewPosition;
const generateByTemplate = require("./apis").generateByTemplate;


const templates = {
    "Jekyll post header template": `---
layout: post
title:  "<title e.g.,MetaVoice 1B - TTS 和语音克隆>"
date:   <datetime e.g.,2024-02-23 21:34:52 +0800>
categories: <tags e.g.,tts MetaVoice>
filename: <filename e.g.,2024-02-23-TTS-voice-clone>
---
`,
    "Q&A List template": `# <title>

Q: <Question>
A: <Answer Content>

Q: <Question>
A: <Answer Content>

Q: <Question>
A: <Answer Content>

......

`
}

function getTemplate(template) {
    if (!templates[template]) {
        return "";
    }
    return templates[template];
}


/**
 * @param {vscode.ExtensionContext} context
 */
async function bytemplateCommand(context) {
    let cancel = false;
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = "Writing Prompts..."
    quickPick.placeholder = "Please enter a writing prompt";
    quickPick.canSelectMany = true; // 允许多选
    let items = [];
    for (let key in templates) {
        items.push({ label: key, alwaysShow: true });
    }
    quickPick.items = items

    quickPick.onDidHide(() => (cancel = true));
    quickPick.onDidAccept(async () => {
        const itemsLen = quickPick.selectedItems.length;
        if (itemsLen === 0) {
            vscode.window.showErrorMessage("Please select a template.");
            return;
        }
        if (itemsLen > 1) {
            vscode.window.showErrorMessage("Please select only one template.");
            return;
        }

        let template = getTemplate(quickPick.selectedItems[0].label);
        if (!template) {
            vscode.window.showErrorMessage("Empty template.");
            return;
        }
        const value = quickPick.value;

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            try {
                cancel = false;
                const selection = editor.selection;
                let insertPosition = selection.isEmpty
                    ? selection.active
                    : selection.end;

                quickPick.busy = true;
                const completion = await generateByTemplate(
                    template,
                    value,
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
    bytemplateCommand,
};