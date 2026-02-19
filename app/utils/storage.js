// utils/storage.js
import { openDB } from 'idb';

const DB_NAME = 'quranRamadanDB';
const DB_VERSION = 1;
const STORE_NAME = 'ramadanData';

// فتح قاعدة البيانات
export const initDB = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // إنشاء مخزن للبيانات إذا لم يكن موجوداً
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });
    console.log('✅ IndexedDB initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Error initializing IndexedDB:', error);
    return null;
  }
};

// حفظ البيانات
export const saveData = async (key, data) => {
  try {
    // محاولة حفظ في IndexedDB أولاً
    const db = await initDB();
    if (db) {
      await db.put(STORE_NAME, {
        id: key,
        value: data,
        timestamp: Date.now(),
      });
      console.log(`✅ Data saved to IndexedDB: ${key}`);
      return true;
    }
  } catch (error) {
    console.warn('⚠️ IndexedDB failed, falling back to localStorage:', error);
  }

  // Fallback إلى localStorage
  try {
    localStorage.setItem(key, JSON.stringify({
      value: data,
      timestamp: Date.now()
    }));
    console.log(`✅ Data saved to localStorage: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ All storage methods failed:', error);
    return false;
  }
};

// استرجاع البيانات
export const loadData = async (key) => {
  try {
    // محاولة القراءة من IndexedDB أولاً
    const db = await initDB();
    if (db) {
      const result = await db.get(STORE_NAME, key);
      if (result) {
        console.log(`✅ Data loaded from IndexedDB: ${key}`);
        return result.value;
      }
    }
  } catch (error) {
    console.warn('⚠️ IndexedDB read failed, trying localStorage:', error);
  }

  // Fallback إلى localStorage
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log(`✅ Data loaded from localStorage: ${key}`);
      return parsed.value;
    }
  } catch (error) {
    console.error('❌ All storage reads failed:', error);
  }

  return null;
};

// حذف البيانات
export const deleteData = async (key) => {
  try {
    const db = await initDB();
    if (db) {
      await db.delete(STORE_NAME, key);
    }
  } catch (error) {
    console.warn('IndexedDB delete failed:', error);
  }
  
  localStorage.removeItem(key);
};

// الحصول على جميع البيانات
export const getAllData = async () => {
  try {
    const db = await initDB();
    if (db) {
      return await db.getAll(STORE_NAME);
    }
  } catch (error) {
    console.error('Error getting all data:', error);
  }
  return [];
};

// مسح البيانات القديمة (أكثر من سنة)
export const cleanOldData = async () => {
  const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
  
  try {
    const db = await initDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      
      let cursor = await index.openCursor();
      while (cursor) {
        if (cursor.value.timestamp < oneYearAgo) {
          await cursor.delete();
        }
        cursor = await cursor.continue();
      }
      await tx.done;
    }
  } catch (error) {
    console.error('Error cleaning old data:', error);
  }
};