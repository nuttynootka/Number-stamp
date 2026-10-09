import { Project, CustomFont } from '../types';

const DB_NAME = 'SequentialPhotoNumbererDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('custom_fonts')) {
          db.createObjectStore('custom_fonts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('app_settings')) {
          db.createObjectStore('app_settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.put({
      ...project,
      updatedAt: Date.now(),
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function listProjects(): Promise<Array<{ id: string; name: string; updatedAt: number; photosCount: number; stampsCount: number }>> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result as Project[]) || [];
      const summaries = list.map((p) => ({
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt,
        photosCount: p.photos ? p.photos.length : 0,
        stampsCount: p.stamps ? p.stamps.length : 0,
      }));
      summaries.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(summaries);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveCustomFont(font: CustomFont): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_fonts', 'readwrite');
    const store = tx.objectStore('custom_fonts');
    const req = store.put(font);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function listCustomFonts(): Promise<CustomFont[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_fonts', 'readonly');
    const store = tx.objectStore('custom_fonts');
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as CustomFont[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCustomFont(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_fonts', 'readwrite');
    const store = tx.objectStore('custom_fonts');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('app_settings', 'readonly');
      const store = tx.objectStore('app_settings');
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.value !== undefined) {
          resolve(req.result.value);
        } else {
          resolve(defaultValue);
        }
      };
      req.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('app_settings', 'readwrite');
      const store = tx.objectStore('app_settings');
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to set setting', e);
  }
}
