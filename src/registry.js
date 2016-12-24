'use babel';

let registry = new Map();
let refreshHandlers = [];

class RegistryEntry {

    constructor({element, refresh, liveTime=Infinity}) {
        this.element = element;
        this.liveTime = liveTime;

        this.refresh = refresh;
        this.refreshable = isFinite(liveTime);

        this.lastChanged = new Date();

        /** will be set after the entry was added to the registry */
        this.id = null;
    }

    get() {
        const now = new Date();
        if (this.refreshable) {
            const nextChange = this.lastChanged.getTime() + this.liveTime;
            if (nextChange < now.getTime()) {
                this.set(this.refresh());
            }
        }
        return this.element;
    }

    set(element) {
        this.lastChanged = new Date();
        this.element = element;
    }

    remove() {
        if (this.id === null) {
            throw new Error('This entry is not part of the registry');
        }

        const wasInRegistry = registry.delete(this.id);
        if (wasInRegistry) {
            this.id = null;
        } else {
            throw new Error('This entry is not part of the registry');
        }
    }
}


function refresh() {
    refreshHandlers.forEach(cb => cb());
}

export function on(event, cb) {
    switch (event) {
        case 'refresh':
            refreshHandlers.push(cb);
            break;
        default:
            throw new Error('Unknown event');
    }
}

export function add(options) {
    const entry = new RegistryEntry(options);

    const id = Symbol();
    entry.id = id;
    registry.set(id, entry);
}

export function getAll({type, filter=[]}={}, doRefresh=true) {
    if (doRefresh) {
        refresh();
    }

    let all = [];

    registry.forEach(entry => {
        const element = entry.get();

        if (type && !(element instanceof type)) {
            return;
        }

        for (let attr of filter) {
            if (attr.value) {
                if (element[attr.name] !== attr.value) {
                    return;
                }
            } else if (attr.values) {
                if (!attr.values.includes(element[attr.name])) {
                    return;
                }
            }
        }

        if (element) {
            all.push(element);
        }
    });

    return all;
}
