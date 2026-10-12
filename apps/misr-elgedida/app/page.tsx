"use client";

import { useState } from "react";

const modules = [
  { title: "أوامر الشغل", description: "إنشاء ومتابعة أوامر الصيانة", icon: "🧰" },
  { title: "العملاء والسيارات", description: "ملفات العملاء وبيانات السيارات", icon: "🚘" },
  { title: "الفواتير والتحصيل", description: "فواتير الخدمات وطرق الدفع", icon: "🧾" },
  { title: "مخزن قطع الغيار", description: "الأصناف والكميات وحركة المخزن", icon: "⚙️" },
  { title: "مخزن الفلاتر", description: "فلاتر الهواء والزيت", icon: "🔧" },
  { title: "مخزن الزيوت", description: "زيوت الموتور والفتيس", icon: "🛢️" },
  { title: "المصروفات والتقارير", description: "المصروفات والتقارير اليومية والشهرية", icon: "📊" },
  { title: "الحضور والانصراف", description: "سجل حضور العاملين", icon: "🕘" }
];

export default function Home() {
  const [selected, setSelected] = useState("لوحة التحكم");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">م</div>
        <div className="brand-copy">
          <strong>مركز المهر</strong>
          <span>ELMOHR CENTER</span>
        </div>
        <div className="branch-label">فرع مصر الجديدة</div>
        <nav aria-label="القائمة الرئيسية">
          {["لوحة التحكم", ...modules.map((item) => item.title), "المستخدمون والصلاحيات", "سجل العمليات"].map((item) => (
            <button
              key={item}
              className={selected === item ? "nav-item active" : "nav-item"}
              onClick={() => setSelected(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <p className="sidebar-note">نسخة تجهيز على GitHub فقط<br />غير متصلة بقاعدة بيانات</p>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">ELMOHR CENTER</p>
            <h1>{selected}</h1>
          </div>
          <span className="status-pill"><span /> وضع التجهيز</span>
        </header>

        <section className="welcome-card">
          <div>
            <p className="eyebrow light">MISr EL GEDIDA BRANCH</p>
            <h2>أهلاً بك في نظام مركز المهر</h2>
            <p>مساحة مستقلة لتجهيز نظام فرع مصر الجديدة، مع مراجعة البيانات قبل أي نقل.</p>
          </div>
          <div className="welcome-icon" aria-hidden="true">🏁</div>
        </section>

        {selected === "لوحة التحكم" ? (
          <>
            <div className="section-heading">
              <h2>أقسام النظام</h2>
              <p>واجهة أولية — الأقسام لم تتصل بقاعدة بيانات بعد.</p>
            </div>
            <div className="module-grid">
              {modules.map((item) => (
                <button className="module-card" key={item.title} onClick={() => setSelected(item.title)}>
                  <span className="module-icon">{item.icon}</span>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                  <span className="card-arrow">←</span>
                </button>
              ))}
            </div>
            <section className="notice">
              <strong>قبل تشغيل البيانات الفعلية</strong>
              <p>سيتم حصر العملاء والسيارات وأوامر الشغل والفواتير والمخازن والمصروفات وسجلات العمليات، ثم اعتماد قائمة واضحة بما سينتقل. لا توجد بيانات فعلية منسوخة في هذه النسخة.</p>
            </section>
          </>
        ) : (
          <section className="placeholder-panel">
            <span className="module-icon">🛠️</span>
            <h2>{selected}</h2>
            <p>هذا القسم ضمن خطة التنفيذ، وسيتم بناؤه وربطه بعد اعتماد تصميم البيانات والصلاحيات.</p>
            <button className="primary-button" onClick={() => setSelected("لوحة التحكم")}>العودة للوحة التحكم</button>
          </section>
        )}
        <footer>© {new Date().getFullYear()} ELMOHR CENTER · Misr El Gedida</footer>
      </section>
    </main>
  );
}
