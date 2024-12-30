// js/indexedDB.js
class SearchDatabase {
    constructor() {
        this.db = null;
        this.DB_NAME = 'partsSearchDB';
        this.DB_VERSION = 2;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            console.log('Initializing IndexedDB...');
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                console.log('IndexedDB opened successfully');
                this.db = request.result;
                resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('Creating/upgrading IndexedDB schema...');
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('vectors')) {
                    db.createObjectStore('vectors', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('items')) {
                    db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('markup')) {
                    db.createObjectStore('markup', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async saveData(vectors, items, markup) {
        console.log('Saving data to IndexedDB...');
        try {
            const stores = ['vectors', 'items', 'markup'];
            const transaction = this.db.transaction(stores, 'readwrite');
            
            // Clear existing data
            await Promise.all(stores.map(store => 
                new Promise((resolve, reject) => {
                    const request = transaction.objectStore(store).clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                })
            ));

            // Save new data
            await Promise.all([
                ...vectors.map((vector, index) => 
                    new Promise((resolve, reject) => {
                        const request = transaction.objectStore('vectors').add({ vector, index });
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    })
                ),
                ...items.map((item, index) => 
                    new Promise((resolve, reject) => {
                        const request = transaction.objectStore('items').add({ item, index });
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    })
                ),
                ...(markup || []).map((range, index) => 
                    new Promise((resolve, reject) => {
                        const request = transaction.objectStore('markup').add({ range, index });
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    })
                )
            ]);
            
            console.log('Data saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save data:', error);
            return false;
        }
    }

    async loadData() {
        console.log('Loading data from IndexedDB...');
        try {
            const vectors = await this.getStoreData('vectors');
            const items = await this.getStoreData('items');
            const markup = await this.getStoreData('markup');
            
            return {
                vectors: vectors.map(r => r.vector),
                items: items.map(r => r.item),
                markup: markup.map(r => r.range)
            };
        } catch (error) {
            console.error('Failed to load data:', error);
            return { vectors: [], items: [], markup: [] };
        }
    }

    async getStoreData(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db.objectStoreNames.contains(storeName)) {
                console.warn(`Store "${storeName}" not found`);
                resolve([]);
                return;
            }

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearData() {
        console.log('Clearing IndexedDB data...');
        try {
            const stores = ['vectors', 'items', 'markup'];
            const transaction = this.db.transaction(stores, 'readwrite');
            
            await Promise.all(stores.map(store => 
                new Promise((resolve, reject) => {
                    const request = transaction.objectStore(store).clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                })
            ));
            
            console.log('Data cleared successfully');
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }
}
