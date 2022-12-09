const BOOL_TYPE = 0;
const STRING_TYPE = 1;

class Flag {

    #name;
    #short = "";
    #type;
    #usage;
    #hidden = false;

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

class FlagValue {

    #flag;
    #value;

    constructor(flag, value) {
        this.#flag = flag;
        if (flag.getType() === BOOL_TYPE) {
            if (typeof value !== "boolean") {
                throw "Value is not a boolean!";
            } else {
                this.#value = value;
            }
        } else if (flag.getType() === STRING_TYPE) {
            if (typeof value !== "string") {
                throw "Value is not a String!";
            } else {
                this.#value = value;
            }
        }
    }

    getValue() {
        return this.#value;
    }

    getType() {
        return this.#flag.getType();
    }

    matchesFlag(flag) {
        return this.#flag === flag;
    }
}
