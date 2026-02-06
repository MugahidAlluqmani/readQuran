// utils/tafsirParser.js
export const parseTafsirXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const rows = xmlDoc.getElementsByTagName('ROW');
    
    const tafsirData = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const getText = (tagName) => {
        const element = row.getElementsByTagName(tagName)[0];
        return element ? element.textContent : '';
      };
      
      const tafsirEntry = {
        id: parseInt(getText('id')) || i + 1,
        jozz: parseInt(getText('jozz')) || 1,
        page: parseInt(getText('page')) || 1,
        sura_no: parseInt(getText('sura_no')) || 1,
        sura_name_en: getText('sura_name_en'),
        sura_name_ar: getText('sura_name_ar'),
        line_start: parseInt(getText('line_start')) || 1,
        line_end: parseInt(getText('line_end')) || 1,
        aya_no: parseInt(getText('aya_no')) || 1,
        aya_text: getText('aya_text'),
        aya_text_emlaey: getText('aya_text_emlaey'),
        aya_tafseer: getText('aya_tafseer')
      };
      
      tafsirData.push(tafsirEntry);
    }
    
    return tafsirData;
  };
  
  // تحميل بيانات التفسير من ملف XML
  export const loadTafsirData = async () => {
    try {
      const response = await fetch('/data/tafseerMouaser_v03.xml');
      const xmlText = await response.text();
      return parseTafsirXML(xmlText);
    } catch (error) {
      console.error('Error loading tafsir data:', error);
      return [];
    }
  };
  
  // تصفية بيانات التفسير حسب السورة والآية
  export const filterTafsirByAyah = (tafsirData, sura_no, aya_no) => {
    return tafsirData.filter(
      entry => entry.sura_no === sura_no && entry.aya_no === aya_no
    );
  };
  
  // الحصول على تفسير آية محددة
  export const getAyahTafsir = (tafsirData, sura_no, aya_no) => {
    const filtered = filterTafsirByAyah(tafsirData, sura_no, aya_no);
    return filtered.length > 0 ? filtered[0] : null;
  };
  
  // البحث في التفسير
  export const searchTafsir = (tafsirData, query) => {
    if (!query.trim()) return [];
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return tafsirData.filter(entry => {
      const searchText = `
        ${entry.aya_tafseer || ''} 
        ${entry.sura_name_ar || ''}
        ${entry.sura_name_en || ''}
      `.toLowerCase();
      
      return searchTerms.every(term => searchText.includes(term));
    });
  };