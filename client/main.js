
// Create Commands
const ROOT_COMMAND = rootCommand();
const SEARCH_COMMAND = searchCommand();
const SENI_SONG_COMMAND = seniSongCommand();
const HELP_COMMAND = helpCommand();

// Setup subcommand linking
ROOT_COMMAND.setSubCommands(
    SEARCH_COMMAND,
    SENI_SONG_COMMAND,
    HELP_COMMAND,
);

// Run the command
//"Under reconstruction";
(() => {
    runCommands(tag.args);
})();

//let val = init(tag.args);
//if (val !== undefined) {
//  return val;
//}

// TODO Embed handling
function runCommands(args) {

    let context = undefined;
    if (args === null || args === "" || args == undefined) {
        // No args passed, do the root action
        context = new Context(ROOT_COMMAND, [], "");
    } else {
        try {
            context = parseArgs(args);
        } catch (err) {
            msg.reply(err.toString());
            return;
        }
    }

    try {
        let retVal = context.run(); // TODO
        if (typeof retVal === 'string' || retVal instanceof String) {
            msg.reply(retVal);
        } else {
            msg.reply( { embed: retVal} );
        }
    } catch (err) {
        if (err.status !== undefined) {
            msg.reply(`Failed with status code ${err.status}`);
        } else {
            msg.reply(err.toString());
        }
    }
}
