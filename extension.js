const vscode = require("vscode");
const writingCommand = require("./src/writing").writingCommand;
const summariesCommand = require("./src/summaries").summariesCommand;
const codingCommand = require("./src/coding").codingCommand;
const genslideCommand = require("./src/genslide").genslideCommand;
const bytemplateCommand = require("./src/bytemplate").bytemplateCommand;
const notelistCommand = require("./src/notelist").notelistCommand;
const addNoteCommand = require("./src/notelist").addNoteCommand;
const imagineCommand = require("./src/genimage").imagineCommand;

const commands = {
    "teamscode.aiwrite": "Continue writing",
    "teamscode.coding": "Smart coding",
    "teamscode.summaries": "Summarize selection",
    "teamscode.genslide": "Create marp slide",
    "teamscode.bytemplate": "Generate by template",
    "teamscode.imagine": "Generate image",
    "teamscode.notelist": "Open note list",
    "teamscode.addNote": "Add to note list",
    "teamscode.showCommands": "Show extension commands",
    "teamscode.openExtensionSettings": "Open extension settings",
};

function activate(context) {
    console.log("initializing TeamsCode extension...")
    context.subscriptions.push(
        vscode.commands.registerCommand("teamscode.aiwrite", async () => {
            await writingCommand(context);
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand("teamscode.summaries", async () => {
            await summariesCommand(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("teamscode.coding", async () => {
            await codingCommand(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("teamscode.genslide", async () => {
            await genslideCommand(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("teamscode.bytemplate", async () => {
            await bytemplateCommand(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("teamscode.imagine", async () => {
            await imagineCommand(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("teamscode.notelist", async () => {
            await notelistCommand(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("teamscode.addNote", async () => {
            await addNoteCommand(context);
        })
    );

    // Register showCommands command
    context.subscriptions.push(
        vscode.commands.registerCommand("teamscode.showCommands", async () => {
            const allCommands = await vscode.commands.getCommands(true);
            const filteredCommands = allCommands.filter((cmd) =>
                cmd.startsWith("teamscode.")
            );
            const quickPickItems = filteredCommands.map((cmd) => ({
                label: commands[cmd],
                description: cmd,
            }));
            const selected = await vscode.window.showQuickPick(quickPickItems, {
                title: "TeamsCode Commands",
                placeHolder: "Select a command",
            });
            if (selected) {
                vscode.commands.executeCommand(selected.description);
            }
        })
    );

    // Register onDidChangeConfiguration event
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration("teamscode.teamsgptApiToken") ||
                e.affectsConfiguration("teamscode.teamsgptApiEndpoint")
            ) {
                vscode.window
                    .showInformationMessage(
                        'Settings for "TeamsCode" have changed. Reload to apply?',
                        "Reload"
                    )
                    .then((selection) => {
                        if (selection === "Reload") {
                            vscode.commands.executeCommand(
                                "workbench.action.reloadWindow"
                            );
                        }
                    });
            }
        })
    );

    // Register openExtensionSettings command
    context.subscriptions.push(vscode.commands.registerCommand('teamscode.openExtensionSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'teamscode');
    }));
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};