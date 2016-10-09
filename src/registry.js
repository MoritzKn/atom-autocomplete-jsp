'use babel';

let registry = new Map();
let refreshHandlers = [];

export class RegistryEntry {
    constructor(options) {
        this.element = options.element;

        if (typeof options.liveTime !== 'undefined') {
            this.liveTime = options.liveTime;
        } else {
            this.liveTime = 600;
        }

        this.refresh = options.refresh;
        this.refreshable = isFinite(this.liveTime);

        this.lastChanged = new Date();

        /** will be set after the entry was added to the registry */
        this.id = null;
    }

    get() {
        const now = new Date();
        if (this.refreshable && this.lastChanged.getTime() + this.liveTime < now.getTime()) {
            this.set(this.refresh());
        }
        return this.element;
    }

    set(element) {
        this.lastChanged = new Date();
        this.element = element;
    }

    remove() {
        if (this.id === null) {
            throw new Error(`This entry is not part of the registry`);
        }

        const wasInRegistry = registry.delete(this.id);
        if (wasInRegistry) {
            this.id = null;
        } else {
            throw new Error(`This entry is not part of the registry`);
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

export function getAll() {
    refresh();

    let all = [];

    registry.forEach(entry => {
        const element = entry.get();

        if (element) {
            all.push(element);
        }
    });

    return all;
}
