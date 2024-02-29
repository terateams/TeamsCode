/* eslint-disable no-unused-vars */
const Note = require("./common").Note;
const vscode = require("vscode");

class TeamsGPTAPI {
    constructor() {
        const config = vscode.workspace.getConfiguration("teamscode");
        this.teamsgptApiEndpoint =
            config.get("teamsgptApiEndpoint") ||
            process.env.TEAMSGPT_API_ENDPOINT ||
            "https://api.teamsgpt.net";
        this.teamsgptApiToken =
            config.get("teamsgptApiToken") ||
            process.env.TEAMSGPT_API_TOKEN ||
            "nokey";
    }

    /**
     * @param {string} sysmsg
     * @param {string} prompt
     */
    async *generate(sysmsg, prompt) {
        const response = await fetch(
            `${this.teamsgptApiEndpoint}/api/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.teamsgptApiToken}`,
                },
                body: JSON.stringify({
                    sysmsg: sysmsg,
                    prompt: prompt,
                }),
            }
        );

        const reader = response.body ? response.body.getReader() : null;
        if (!reader) {
            throw new Error("Response body is undefined");
        }

        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                return;
            }

            const decodedChunk = decoder.decode(value);
            // Clean up the data
            const lines = decodedChunk
                .split("\n")
                .map((line) => line.replace("data: ", ""))
                .filter((line) => line.length > 0)
                .filter((line) => line !== "[DONE]")
                .map((line) => JSON.parse(line));
            // console.log(lines);

            for (const line of lines) {
                if (line.content) {
                    yield line;
                }
            }
        }
    }
}

const client = new TeamsGPTAPI();

/**
 * Call OpenAI to generate content based on the provided context and prompt.
 * @param {string} beforeText - The text before the selected text.
 * @param {string} afterText - The text after the selected text.
 * @param {string} selectedText - The selected text.
 * @param {string} prompt - The prompt for generating content.
 * @param {Note[]} notes - The notes for generating content.
 * @param {string} writeStyle
 * @param {boolean} slideContent
 * @returns {Promise<Object>} - The completion object returned by OpenAI.
 */
async function smartWriting(
    beforeText,
    afterText,
    selectedText,
    prompt,
    notes,
    writeStyle,
    slideContent
) {
    const contextMessage = `
----------------------------------
${beforeText}${selectedText}
<Generate content>
${afterText}
----------------------------------

`;

    let noteMessages = "";
    if (notes && notes.length > 0) {
        noteMessages =
            "The following is additional contextual information, please refer to it when generating content:\n\n";
        for (const note of notes) {
            noteMessages += `${note.content}\n\n`;
        }
    }

    if (writeStyle) {
        writeStyle = "Pay attention to the " + writeStyle + ".";
    }

    let sysmsg = `You are an intelligent writing assistant, now working on the following content, \
    Please complete the <Generate content> section, ${writeStyle}\ntaking care to refer to the context \
    and not generating redundant content:\n${contextMessage}${noteMessages}`;

    if (slideContent) {
        sysmsg = `You are an  marp slide creation assistant, now working on the following content, \
        Please complete the <Generate content> section, ${writeStyle}\nGenerate content that is concise, \
        using a few sentences or a brief checklist, taking care to refer to the context \
        and not generating redundant content:\n${contextMessage}${noteMessages}`;
    }

    const completion = await client.generate(sysmsg, prompt);
    return completion;
}

/**
 * Call OpenAI to generate summaries based on the provided selected text and prompt.
 * @param {string} selectedText - The selected text.
 * @param {string} prompt - The prompt for generating summaries.
 * @returns {Promise<Object>} - The completion object returned by OpenAI.
 */
async function smartSummaries(
    selectedText,
    prompt
) {
    const contextMessage =
        "\n----------------------------------\n" +
        selectedText +
        "\n----------------------------------\n";
    const sysmsg =
        "You're an intelligent writing assistant with the writing skills \
    and insights of a master. Please provide a summary summary of the following:\n" +
        contextMessage;
    const completion = await client.generate(sysmsg, prompt);
    return completion;
}

/**
 * Call OpenAI to generate code based on the provided context and prompt.
 * @param {string} beforeText - The text before the selected text.
 * @param {string} afterText - The text after the selected text.
 * @param {string} selectedText - The selected text.
 * @param {string} prompt - The prompt for generating content.
 * @param {Note[]} notes - The notes for generating content.
 * @returns {Promise<Object>} - The completion object returned by OpenAI.
 */
async function smartCoding(
    beforeText,
    afterText,
    selectedText,
    prompt,
    notes
) {
    const contextMessage = `
----------------------------------
${beforeText}${selectedText}
<Generate code>
${afterText}
----------------------------------

`;

    let noteMessages = "";
    if (notes) {
        noteMessages =
            "The following is additional contextual information, please refer to it when generating code:\n\n";
        for (const note of notes) {
            noteMessages += `${note.content}\n\n`;
        }
    }
    const sysmsg = `You are a super-intelligent programming assistant who specializes in writing logical, \
    concise and efficient program code, and you are developing the code for the following applications, \
    Please complete the <Generate code> section, Note that only pure code is generated, don't wrap code in backquotes!\
    taking care to refer to the context and not generating redundant content:\n${contextMessage}${noteMessages}`;
    const completion = await client.generate(sysmsg, prompt);
    return completion;
}

/**
 * Call OpenAI to generate a Marp slide based on the provided prompt.
 * @param {string} prompt - The prompt for generating the Marp slide.
 * @param {Note[]} notes
 * @returns {Promise<Object>} - The completion object returned by OpenAI.
 */
async function smartGenMarpSlide(
    prompt,
    notes
) {
    let noteMessages = "";
    if (notes) {
        noteMessages =
            "---------------------\n\
        The following is additional contextual information, please refer to it when generating content:\n\n";
        for (const note of notes) {
            noteMessages += `${note.content}\n\n`;
        }
    }

    const sysmsg = `You are a marp slide creation assistant that creates a beautifully laid out slide based on a theme proposed by a user. The following is a template for a marp slide, please generate the final slide by combining the template with the theme requirements entered by the user.

---
marp: true
theme: gaia
class: lead
backgroundColor: #fff
backgroundImage: url('https://teamsgptblob.blob.core.windows.net/images/slide-background.svg')
style: |
    h1 {
        font-size: 3em;
    }
    h2 {
        font-size: 2.2em;
    }
---


![bg left:30% 80%](https://teamsgptblob.blob.core.windows.net/images/teamscode.svg)

# Introduction to Marp

---

## What is Marp?

Marp is a powerful Markdown presentation tool that enables you to create clean, simple slides using Markdown syntax.

---

## Key Features

- **Markdown-driven**: Write your slides in Markdown and convert them into HTML, PDF, or PowerPoint presentations.
- **Customizable Themes**: Apply or create custom themes to make your presentation stand out.
- **Cross-platform**: Available as a CLI tool, a desktop app, and a VS Code extension.

---

## Getting Started

1. Install Marp CLI or Marp for VS Code.
2. Write your slides in Markdown.
3. Convert your Markdown to a presentation.

---

## Why Use Marp?

- Easy to use and learn.
- Focus on content, not formatting.
- Portable and easy to share presentations.

---

## Resources

- [Official Website](https://marp.app/)
- [GitHub Repository](https://github.com/marp-team/marp)

---

Thank You!


${noteMessages}
`;
    const completion = await client.generate(sysmsg, prompt);
    return completion;
}

async function generateByTemplate(
    template,
    prompt
) {

    const datetime = new Date().toLocaleString();
    const sysmsg = `Please follow the given template format to generate content.

//Guidelines
- Current system time is ${datetime}, which can be used in generating content.
- Analyze the user input prompts to specify the content to be generated.
- Analyze the given template, which may have specific requirements for content generation that must be followed.
- Note that the template only provides the format of the content, and the specific content to be generated is based on the user input prompts.
- Generate specific content in response to input prompts to replace <...> content in the template. Generate specific content in response to input prompts to replace <... > content in the template, if it exists.
- Strictly adhere to the template format and do not generate extraneous content.
- If '.....' is present in the template, it means that more content needs to be generated according to the template specification.
- If '...end' is present in the template, stop generating here, but make sure not to output '...end'.
- If the user specifies a language, follow the request to output the content in the specified language.

// The given content template is as follows.

${template}
`;
    const completion = await client.generate(sysmsg, prompt);
    return completion;

}


module.exports = {
    smartWriting,
    smartSummaries,
    smartCoding,
    smartGenMarpSlide,
    generateByTemplate
};