// src/utilities/fileCache.js

/**
 * Opens and returns a connection to the IndexedDB database.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database connection.
 */
function getDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('dgnotes-shared-files', 1);

        request.onerror = event => reject("IndexedDB error: " + event.target.errorCode);
        request.onsuccess = event => resolve(event.target.result);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

/**
 * Retrieves the most recent file from the IndexedDB cache.
 * @returns {Promise<File|null>} A promise that resolves with the latest file or null if none exists.
 */
export async function getFile() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const allFilesRequest = store.getAll();

        allFilesRequest.onsuccess = () => {
            if (allFilesRequest.result && allFilesRequest.result.length > 0) {
                // Sort by timestamp descending to get the most recent file
                const sorted = allFilesRequest.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(sorted[0].file);
            } else {
                resolve(null);
            }
        };
        allFilesRequest.onerror = (event) => reject("Failed to get files: " + event.target.errorCode);
    });
}

/**
 * Clears all files from the IndexedDB object store.
 * @returns {Promise<void>} A promise that resolves when the store is cleared.
 */
export async function clearFiles() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject("Failed to clear files: " + event.target.errorCode);
    });
}