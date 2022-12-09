
// Create Commands
const ROOT_COMMAND = rootCommand();
const SEARCH_COMMAND = searchCommand();
const DAN_SONG_COMMAND = danSongCommand();
const HELP_COMMAND = helpCommand();

// Setup subcommand linking
ROOT_COMMAND.setSubCommands(
    SEARCH_COMMAND,
    DAN_SONG_COMMAND,
    HELP_COMMAND,
);

// Run the command
"Under reconstruction";
// runCommands(tag.args);

//let val = init(tag.args);
//if (val !== undefined) {
//  return val;
//}

// TODO Embed handling
function runCommands(args) {
    // No args passed, do the root action
    if (args === null || args === "" || args == undefined) {
        return root.action({ command: root, args: "", flags: [] });
    }

    let context = undefined;
    try {
        context = parseArgs(args);
    } catch (err) {
        return err.toString();
    }

    try {
        return context.run();
    } catch (err) {
        if (err.status !== undefined) {
            return getRetVal(`Failed with status code ${err.status}`, "", false);
        } else {
            return getRetVal(err.toString(), "", false);
        }
    }
}
