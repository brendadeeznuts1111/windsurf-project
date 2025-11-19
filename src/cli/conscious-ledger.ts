// Consciousness Ledger for tracking vault operations
export interface LedgerEntry {
    type: string;
    timestamp: string;
    data?: Record<string, any>;
}

export class ConsciousLedger {
    private static entries: LedgerEntry[] = [];

    static log(entry: Omit<LedgerEntry, 'timestamp'>): void {
        this.entries.push({
            ...entry,
            timestamp: new Date().toISOString()
        });

        console.log(`📊 Ledger: ${entry.type}`, entry.data || '');
    }

    static getEntries(): LedgerEntry[] {
        return [...this.entries];
    }

    static clear(): void {
        this.entries = [];
    }
}
