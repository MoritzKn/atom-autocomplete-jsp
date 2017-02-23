'use babel';

const registry = new Map();
const refreshHandlers = [];

let cache = new WeakMap();
function cleanCache(forType) {
    if (forType) {
        cache[forType] = null;
    } else {
        cache = new WeakMap();
    }
}

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
        const type = this.element.constructor;

        const wasInRegistry = registry.delete(this.id);
        if (wasInRegistry) {
            this.id = null;
            cleanCache(type);
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

    const type = options.element.constructor;
    cleanCache(type);
}

function applyFilters(filter, element) {
    function* applyRule(rule) {
        const prop = element[rule.name];

        if (rule.type) {
            yield typeof prop === rule.type;
        }

        if (rule.value) {
            yield rule.value === prop;
        } else if (rule.values) {
            yield rule.values.includes(prop);
        }
    }

    for (const rule of filter) {
        for (const step of applyRule(rule)) {
            if ((rule.negate && step) || !step) {
                return false;
            }
        }
    }
    return true;
}

function registryEntries() {
    const entries = [];
    registry.forEach(entry => entries.push(entry));
    return entries;
}

function registryEntriesByType(type) {
    if (type) {
         if (!cache[type]) {
            cache[type] = registryEntries().filter(element => element.get() instanceof type);
        }
        return cache[type];
    } else {
        return registryEntries();
    }
}

export function getAllEntries({type, filter=[]}={}, doRefresh=true) {
    if (doRefresh) {
        refresh();
    }

    return registryEntriesByType(type).filter(entry => {
        const element = entry.get();
        return element && applyFilters(filter, element);
    });
}

export function getAll({type, filter=[]}={}, doRefresh=true) {
    return getAllEntries({type, filter}, doRefresh).map(entry => entry.get());
}
