class FlagValue {

    #flag = undefined; // Flag
    #value = undefined; // Value dependent on the type of flag

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