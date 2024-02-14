const vscode = require('vscode');
const crypto = require('crypto');

class Note {
    /**
     * @param {string} title
     * @param {string} content
     */
    constructor(title, content) {
        this.id = generateHash(title + content);
        this.title = title;
        this.content = content;
    }
}

/**
 * @param {string} content
 */
function generateHash(content) {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
}

/**
 * @param {string} content
 */
function insertNoteContentIntoActiveEditor(content) {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        const position = activeEditor.selection.active; // 获取当前光标的位置
        activeEditor.edit(editBuilder => {
            editBuilder.insert(position, content); // 在当前光标的位置插入内容
        });
    }
}

/**
 * @param {vscode.Position} originalPosition
 * @param {string} newText
 */
function getNewPosition(originalPosition, newText) {
    const lines = newText.split('\n');
    const addedLines = lines.length - 1;
    const lastLineLength = lines[lines.length - 1].length;

    if (addedLines === 0) {
        return originalPosition.translate(0, lastLineLength);
    } else {
        const newLine = originalPosition.line + addedLines;
        const newChar = addedLines === 0 ? originalPosition.character + lastLineLength : lastLineLength;
        return new vscode.Position(newLine, newChar);
    }
}

/**
 * @param {string} text
 */
function getTitleFromText(text) {
    if (text.length <= 20) {
        return text;
    } else {
        return text.substring(0, 20);
    }
}

module.exports = {
    Note,
    generateHash,
    insertNoteContentIntoActiveEditor,
    getNewPosition,
    getTitleFromText
};