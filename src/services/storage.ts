import type { TickData, OHLCData } from '@/types/trading';

const DB_NAME = 'TradingAnalyticsDB';
const DB_VERSION = 1;
const TICK_STORE = 'ticks';
const OHLC_STORE = 'ohlc';

export class StorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(TICK_STORE)) {
          const tickStore = db.createObjectStore(TICK_STORE, { keyPath: 'id', autoIncrement: true });
          tickStore.createIndex('symbol', 'symbol', { unique: false });
          tickStore.createIndex('timestamp', 'timestamp', { unique: false });
          tickStore.createIndex('symbolTimestamp', ['symbol', 'timestamp'], { unique: false });
        }

        if (!db.objectStoreNames.contains(OHLC_STORE)) {
          const ohlcStore = db.createObjectStore(OHLC_STORE, { keyPath: 'id', autoIncrement: true });
          ohlcStore.createIndex('symbol', 'symbol', { unique: false });
          ohlcStore.createIndex('timestamp', 'timestamp', { unique: false });
          ohlcStore.createIndex('symbolTimestamp', ['symbol', 'timestamp'], { unique: false });
        }
      };
    });
  }

  async saveTick(tick: TickData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TICK_STORE], 'readwrite');
      const store = transaction.objectStore(TICK_STORE);
      const request = store.add(tick);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveTicks(ticks: TickData[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TICK_STORE], 'readwrite');
      const store = transaction.objectStore(TICK_STORE);

      let completed = 0;
      const total = ticks.length;

      for (const tick of ticks) {
        const request = store.add(tick);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      }
    });
  }

  async getTicks(symbol: string, startTime?: number, endTime?: number): Promise<TickData[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TICK_STORE], 'readonly');
      const store = transaction.objectStore(TICK_STORE);
      const index = store.index('symbolTimestamp');

      const range = startTime && endTime
        ? IDBKeyRange.bound([symbol, startTime], [symbol, endTime])
        : IDBKeyRange.bound([symbol, 0], [symbol, Date.now()]);

      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveOHLC(ohlc: OHLCData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OHLC_STORE], 'readwrite');
      const store = transaction.objectStore(OHLC_STORE);
      const request = store.add(ohlc);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveOHLCBatch(ohlcData: OHLCData[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OHLC_STORE], 'readwrite');
      const store = transaction.objectStore(OHLC_STORE);

      let completed = 0;
      const total = ohlcData.length;

      for (const ohlc of ohlcData) {
        const request = store.add(ohlc);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      }
    });
  }

  async getOHLC(symbol: string, startTime?: number, endTime?: number): Promise<OHLCData[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([OHLC_STORE], 'readonly');
      const store = transaction.objectStore(OHLC_STORE);
      const index = store.index('symbolTimestamp');

      const range = startTime && endTime
        ? IDBKeyRange.bound([symbol, startTime], [symbol, endTime])
        : IDBKeyRange.bound([symbol, 0], [symbol, Date.now()]);

      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldData(olderThan: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stores = [TICK_STORE, OHLC_STORE];

    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(olderThan);
        const request = index.openCursor(range);

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    }
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stores = [TICK_STORE, OHLC_STORE];

    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

export const storage = new StorageService();
