const FOOTER_TEXT = "Generated automatically for the music command"
const FOOTER_ICON = "https://media.discordapp.net/attachments/814985279697846306/1050681221878919229/guitar.png";
const THUMBNAIL_ICON = "https://media.discordapp.net/attachments/814985279697846306/1050681207236595802/musical_note.png";

function generateHelpText(command) {
    let embed = getEmbedBase(command);
    let fieldsIdx = 0;
    let fields = [];

    // Subcommands (normal fields)
    if (command.subcommands != undefined && command.subcommands.length > 0) {
        for (let i = 0; i < command.subcommands.length; i++) {
            fields[i] = {
                name: command.subcommands[i].name,
                value: command.subcommands[i].usage,
            };
        }
        fieldsIdx = command.subcommands.length + 1;
    }

    // Flags (inline fields)
    if (command.flags != undefined && command.flags.length > 0) {
        for (let i = 0; i < command.flags.length; i++) {
            if (command.flags[i].name === "help") {
                continue;
            }

            // Gather the normal and short names of this flag
            let name = `--${command.flags[i].name}`;
            if (command.flags[i].short != undefined) {
                name += `, -${command.flags[i].short}`;
            }

            fields[i + fieldsIdx] = {
                name: name,
                value: command.flags[i].usage,
                inline: true,
            };
        }
    }

    if (fields.length > 0) {
        embed.fields = fields;
    }

    // TODO
    return getRetVal(embed, "", true);
}

function getEmbedBase(command) {
    return {
        title: command.getName(),
        color: 0x5DADEC,
        description: command.getUsage(),
        footer: {
            text: FOOTER_TEXT,
            iconURL: FOOTER_ICON
        },
        thumbnail: {
            url: THUMBNAIL_ICON
        },
    };
}