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

`,
    "Socratic Explorer": `
The importance of personalized learning lies in its ability to meet the learning needs, interests, and speed of different students. This method of teaching helps students learn more effectively while increasing their engagement and motivation. The following questions are designed to lead you to think deeply about the value of personalized learning: 

- How does personalized learning meet the different learning needs and preferences of each student?
- How does it help students advance in the areas they are most interested in and most needed?
- In a personalized learning environment, how can teachers ensure that each student has access to resources and guidance appropriate to their level of development?
- How does personalized learning promote students' ability to learn independently and at their own pace?
- What are the requirements for teaching resources and teacher training for the implementation of personalized learning?
- What is the impact of personalized learning on students' academic achievement and personal growth over the long term?
- How can you evaluate the effectiveness of personalized learning strategies in practice?    
`
}

const clarificationList = {
    "Jekyll post header template": "Create headlines that are creative and intriguing, but don't overstate the case.",
    "Q&A List template": "Create at least 5 Q&A",
    "Socratic Explorer": "Analyze the user's input and use the Socratic questioning method to generate a concise, detailed, and easy-to-understand list of questions. Challenge assumptions in a reflective way. Ensure that image standards are met."
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
        const clarification = clarificationList[quickPick.selectedItems[0].label];
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
                    clarification
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