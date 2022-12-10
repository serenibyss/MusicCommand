const BOOL_TYPE = 0;
const STRING_TYPE = 1;

class Flag {

    #name = ""; // String
    #short = ""; // String
    #type = -1; // Integer
    #usage = ""; // String
    #hidden = false; // Boolean

    constructor(name, short, type, usage) {
        this.#name = name;
        this.#short = short;
        this.#type = type;
        this.#usage = usage;
    }

    getType() {
        return this.#type;
    }

    matches(name) {
        return this.#name === name || this.#short === name;
    }

    // Format as a Discord inline field
    getHelpText() {
        if (this.#hidden) {
            return undefined;
        }
        let name = `--${this.#name}`;
        if (this.#short !== "") {
            name += `, -${this.#short}`;
        }

        return {
            name: name,
            value: this.#usage,
            inline: true,
        };
    }

    setHidden() {
        this.#hidden = true;
    }
}
