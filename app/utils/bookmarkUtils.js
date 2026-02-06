// utils/bookmarkUtils.js
export const BookmarkUtils = {
    // حفظ جميع البيانات
    saveAllData: (position, bookmarks) => {
      try {
        if (position) {
          localStorage.setItem('quran_last_position', JSON.stringify(position));
        }
        if (bookmarks) {
          localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
        }
        return true;
      } catch (error) {
        console.error('Error saving data:', error);
        return false;
      }
    },
  
    // تصدير البيانات
    exportData: () => {
      try {
        const position = localStorage.getItem('quran_last_position');
        const bookmarks = localStorage.getItem('quran_bookmarks');
        
        const data = {
          lastPosition: position ? JSON.parse(position) : null,
          bookmarks: bookmarks ? JSON.parse(bookmarks) : [],
          exportDate: new Date().toISOString(),
          version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quran-progress-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return true;
      } catch (error) {
        console.error('Error exporting data:', error);
        return false;
      }
    },
  
    // استيراد البيانات
    importData: (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            
            if (data.lastPosition) {
              localStorage.setItem('quran_last_position', JSON.stringify(data.lastPosition));
            }
            
            if (data.bookmarks && Array.isArray(data.bookmarks)) {
              localStorage.setItem('quran_bookmarks', JSON.stringify(data.bookmarks));
            }
            
            resolve(true);
          } catch (error) {
            reject(new Error('Invalid data format'));
          }
        };
        
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsText(file);
      });
    },
  
    // مسح جميع البيانات
    clearAllData: () => {
      try {
        localStorage.removeItem('quran_last_position');
        localStorage.removeItem('quran_bookmarks');
        return true;
      } catch (error) {
        console.error('Error clearing data:', error);
        return false;
      }
    }
  };