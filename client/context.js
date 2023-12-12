class Context {

    #command = undefined; // Command
    #flagValues = []; // Array[FlagValue]
    #args = ""; // String

    constructor(command, flagValues, args) {
        this.#command = command;
        this.#flagValues = flagValues;
        this.#args = args;
    }

    run() {
        if (this.#command === HELP_COMMAND) {
            return ROOT_COMMAND.getHelpText();
        }
        let helpValue = this.getFlagValue(HELP_FLAG);
        if (helpValue !== undefined && helpValue === true) {
            return this.#command.getHelpText();
        }
        return this.#command.run(this);
    }

    hasArgs() {
        return this.#args !== "";
    }

    getArgs() {
        return this.#args;
    }

    getHelpText() {
        return this.#command.getHelpText();
    }

    getFlagValue(flag) {
        for (let i = 0; i < this.#flagValues.length; i++) {
            let value = this.#flagValues[i];
            if (value.matchesFlag(flag)) {
                return value.getValue();
            }
        }
        if (flag.getType() == BOOL_TYPE) {
            return false;
        }
        return undefined;
    }
}
