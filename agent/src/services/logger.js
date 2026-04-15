const EventEmitter = require('events');

class Logger extends EventEmitter {
    constructor(maxEntries = 500) {
        super();
        this.entries = [];
        this.maxEntries = maxEntries;
    }

    _add(level, message, source = 'system') {
        const entry = {
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            level,
            message,
            source,
        };

        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }

        // Emit for real-time streaming to UI
        this.emit('log', entry);

        // Also console.log
        const prefix = level === 'error' ? '✗' : level === 'warn' ? '⚠' : level === 'success' ? '✓' : '›';
        console.log(`[${entry.time}] ${prefix} ${message}`);
    }

    info(message, source) { this._add('info', message, source); }
    warn(message, source) { this._add('warn', message, source); }
    error(message, source) { this._add('error', message, source); }
    success(message, source) { this._add('success', message, source); }

    getEntries(count = 100) {
        return this.entries.slice(-count);
    }

    clear() {
        this.entries = [];
    }
}

// Singleton
const logger = new Logger();

module.exports = logger;
