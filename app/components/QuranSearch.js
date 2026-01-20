"use client"

import { useEffect, useMemo, useState } from "react";

export default function QuranSearch({ onResult }) {
  const [quran, setQuran] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedSura, setSelectedSura] = useState(null);
  const [fromAya, setFromAya] = useState(1);
  const [toAya, setToAya] = useState(1);

  /* =========================
     تحميل بيانات القرآن
  ========================= */
  useEffect(() => {
    fetch("/data/hafs_smart_v8.json")
      .then(res => res.json())
      .then(setQuran)
      .catch(console.error);
  }, []);

  /* =========================
     استخراج السور بدون تكرار
  ========================= */
  const suras = useMemo(() => {
    const map = new Map();
    quran.forEach(a => {
      if (!map.has(a.sura_no)) {
        map.set(a.sura_no, {
          sura_no: a.sura_no,
          sura_name_ar: a.sura_name_ar,
          sura_name_en: a.sura_name_en,
        });
      }
    });
    return Array.from(map.values());
  }, [quran]);

  /* =========================
     البحث الحرفي
  ========================= */
  const filteredSuras = useMemo(() => {
    if (!query) return [];
    return suras.filter(s =>
      s.sura_name_ar.includes(query) ||
      s.sura_name_en.toLowerCase().includes(query.toLowerCase()) ||
      s.sura_no.toString().startsWith(query)
    );
  }, [query, suras]);

  /* =========================
     عند اختيار سورة
  ========================= */
  const handleSelect = (sura) => {
    setSelectedSura(sura);
    setQuery(sura.sura_name_ar);

    const suraAyat = quran.filter(a => a.sura_no === sura.sura_no);
    const start = Math.min(...suraAyat.map(a => a.aya_no));
    const end = Math.max(...suraAyat.map(a => a.aya_no));

    setFromAya(start);
    setToAya(end);
  };

  /* =========================
     جلب الآيات حسب الاختيار
  ========================= */
  const ayatResult = useMemo(() => {
    if (!selectedSura) return [];
    return quran.filter(a =>
      a.sura_no === selectedSura.sura_no &&
      a.aya_no >= fromAya &&
      a.aya_no <= toAya
    );
  }, [quran, selectedSura, fromAya, toAya]);

  /* =========================
     إرسال النتيجة للأب
  ========================= */
  useEffect(() => {
    onResult?.(ayatResult);
  }, [ayatResult, onResult]);

  return (
    <div style={{ maxWidth: 500, position: "relative" }}>
      {/* البحث */}
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedSura(null);
        }}
        placeholder="اكتب اسم السورة..."
      />

      {/* الاقتراحات */}
      {filteredSuras.length > 0 && !selectedSura && (
        <ul className="suggestions">
          {filteredSuras.map(s => (
            <li key={s.sura_no} onClick={() => handleSelect(s)}>
              {s.sura_name_ar} ({s.sura_no})
            </li>
          ))}
        </ul>
      )}

      {/* تحديد الآيات */}
      {selectedSura && (
        <div style={{ marginTop: 10 }}>
          <input
            type="number"
            min={1}
            value={fromAya}
            onChange={(e) => setFromAya(+e.target.value)}
          />
          <input
            type="number"
            min={fromAya}
            value={toAya}
            onChange={(e) => setToAya(+e.target.value)}
          />
        </div>
      )}

      {/* عرض الآيات */}
      <div className="quran-text">
        {ayatResult.map(a => (
          <p key={a.id}>
            {a.aya_text}
            <span className="aya-no">﴿{a.aya_no}﴾</span>
          </p>
        ))}
      </div>
    </div>
  );
}