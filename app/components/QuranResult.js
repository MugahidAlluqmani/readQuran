export default function QuranResult({ data }) {
    return (
      <div className="quran-text">
        {data.map((aya) => (
          <p key={aya.id}>
            {aya.aya_text}
            <span style={{ fontSize: 14, marginRight: 8 }}>
              ({aya.aya_no})
            </span>
          </p>
        ))}
      </div>
    );
  }