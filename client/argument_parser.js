function parseArgs(args) {
    let splitArgs = args.split(" ");
    let chosenCmd = ROOT_COMMAND;
    let currentIndex = 0;
    let providedFlags = [];
  
    // First, parse args until we find the current "deepest" subcommand we can do
    for (let i = 0; i < splitArgs.length; i++) {
        // Pass empty strings
        if (splitArgs[i] == "") {
            currentIndex++;
            continue;
        }

        if (!chosenCmd.hasSubCommands()) {
            // No possible subcommands, move on to flags
            break;
        }

        let found = false;
        let subCommands = chosenCmd.getSubCommands();
        for (let j = 0; j < subCommands.length; j++) {
            // Check if current argument matches any of the possible subcommands
            if (subCommands[j].matches(splitArgs[i])) {
                // If it does, pick that command and continue
                chosenCmd = subCommands[j];
                found = true;
                break;
            }
        }
        if (!found) {
            break;
        } else {
            currentIndex++;
        }
    }

    // Next, parse args to try and process any flags
    for (let i = currentIndex; i < splitArgs.length; i++) {
        // Pass empty strings
        if (splitArgs[i] == "") {
            currentIndex++;
            continue;
        }

        if (!chosenCmd.hasFlags()) {
            // No possible flags, break
            break;
        }

        let found = false;
        let flagNameRaw = splitArgs[i].replaceAll("-", "");
        let flag = chosenCmd.getFlag(flagNameRaw);
        if (flag !== undefined) {
            found = true;

            if (flag.getType() === BOOL_TYPE) {
                currentIndex++;
                providedFlags.push(new FlagValue(flag, true));
            } else if (flag.getType() === STRING_TYPE) {
                if (splitArgs.length <= i + 1) {
                    throw `Flag ${flagNameRaw} must have data following it.`;
                }
                currentIndex += 2;
                providedFlags.push(new FlagValue(flag, splitArgs[++i]));
            }
        }
        if (!found) {
            break;
        }
    }

    // Build and return the context object
    return new Context(chosenCmd, providedFlags, splitArgs.slice(currentIndex).join(" "));
}
