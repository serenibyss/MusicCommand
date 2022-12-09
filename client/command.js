const FOOTER_TEXT = "Generated automatically for the music command"
const FOOTER_ICON = "https://media.discordapp.net/attachments/814985279697846306/1050681221878919229/guitar.png";
const THUMBNAIL_ICON = "https://media.discordapp.net/attachments/814985279697846306/1050681207236595802/musical_note.png";

class Command {

    #name; // String
    #usage; // String
    #action; // Function(Context)
    #subCommands = []; // Array[Command]
    #flags = []; // Array[Flag]

    constructor(name) {
        this.#name = name;
    }

    matches(name) {
        return this.#name === name;
    }

    setAction(action) {
        this.#action = action;
    }

    setUsage(usage) {
        this.#usage = usage;
    }

    run(ctx) {
        if (this.#action !== undefined) {
            return this.#action(ctx);
        }
    }

    setSubCommands(...subCommands) {
        this.#subCommands = subCommands;
    }

    getSubCommands() {
        return this.#subCommands;
    }

    hasSubCommands() {
        return this.#subCommands.length > 0;
    }

    setFlags(...flags) {
        this.#flags = flags;
    }

    hasFlag(flag) {
        if (this.hasFlags()) {
            for (let i = 0; i < this.#flags.length; i++) {
                if (this.#flags[i] === flag) {
                    return true;
                }
            }
        }
        return false;
    }

    getFlag(flagName) {
        if (this.hasFlags()) {
            for (let i = 0; i < this.#flags.length; i++) {
                if (this.#flags[i].matches(flagName)) {
                    return this.#flags[i];
                }
            }
        }
        return undefined;
    }

    hasFlags() {
        return this.#flags.length > 0;
    }

    getHelpText() {
        let embed = this.#getEmbedBase();
        let fields = [];
        let fieldIdx = 0;

        // Subcommands (Discord Embed Fields)
        for (let i = 0; i < this.#subCommands.length; i++) {
            fields[fieldIdx] = {
                name: this.#subCommands[i].#name,
                value: this.#subCommands[i].#usage,
            };
            fieldIdx++;
        }

        // Flags (Discord Embed Inline-Fields)
        for (let i = 0; i < this.#flags.length; i++) {
            let helpText = this.#flags.getHelpText();
            if (helpText !== undefined) {
                fields[fieldIdx] = helpText;
                fieldIdx++;
            }
        }

        if (fields.length > 0) {
            embed.fields = fields;
        }

        return embed;
    }

    #getEmbedBase() {
        return {
            title: this.#name,
            color: 0x5DADEC,
            description: this.#usage,
            footer: {
                text: FOOTER_TEXT,
                iconURL: FOOTER_ICON
            },
            thumbnail: {
                url: THUMBNAIL_ICON
            },
        };
    }
}
