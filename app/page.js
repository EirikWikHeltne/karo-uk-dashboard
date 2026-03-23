"use client";
import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SB_URL = "https://gvuuuufvwqsbwetxvums.supabase.co/rest/v1";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dXV1dWZ2d3FzYndldHh2dW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDMwMDUsImV4cCI6MjA4OTU3OTAwNX0.AlK4zqknOVnPTnp08V2dX7eHJqh1geDLoLdZqVBe5i4";
const SB_HEADERS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

async function fetchSB(path) {
  const r = await fetch(`${SB_URL}${path}`, { headers: SB_HEADERS });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}

const T = {
  primary: "#110B36", secondary: "#FAD7C2", text: "#1a1a2e",
  muted: "#6B7280", divider: "#e8e8e8", bg: "#FAFAF8",
  card: "#FFFFFF", accent: "#E8C4AD",
};

const BRAND_COLORS = {
  E45: "#110B36", CeraVe: "#6D28D9", Nivea: "#1D4ED8", Oilatum: "#B45309",
  Vaseline: "#047857", Aveeno: "#4D7C0F", Simple: "#BE185D", Eurax: "#B91C1C", QV: "#7C3AED",
};

const font = "'Euclid Circular A', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const fmt = (v) => `£${Number(v).toFixed(2)}`;
const CATEGORIES = ["All", "Emollient", "Body Lotion", "Face Care", "Treatment"];

const StatCard = ({ label, value, sub, highlight }) => (
  <div style={{
    background: highlight ? T.primary : T.card, borderRadius: 10,
    padding: "22px 24px", border: highlight ? "none" : `1px solid ${T.divider}`,
  }}>
    <div style={{ fontFamily: font, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: highlight ? "rgba(255,255,255,0.55)" : T.muted, marginBottom: 8 }}>{label}</div>
    <div style={{ fontFamily: font, fontSize: 30, fontWeight: 600, color: highlight ? "#fff" : T.text, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{value}</div>
    {sub && <div style={{ fontFamily: font, fontSize: 12, color: highlight ? "rgba(255,255,255,0.6)" : T.muted, marginTop: 8, lineHeight: 1.4 }}>{sub}</div>}
  </div>
);

const Badge = ({ children, color = T.primary, filled }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 4, fontSize: 10,
    fontWeight: 600, fontFamily: font, letterSpacing: "0.04em", textTransform: "uppercase",
    background: filled ? color : `${color}10`, color: filled ? "#fff" : color,
  }}>{children}</span>
);

const SectionTitle = ({ title, subtitle }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: "-0.01em" }}>{title}</div>
    {subtitle && <div style={{ fontFamily: font, fontSize: 12, color: T.muted, marginTop: 3 }}>{subtitle}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.primary, borderRadius: 8, padding: "10px 14px", boxShadow: "0 8px 24px rgba(17,11,54,0.25)" }}>
      <div style={{ fontFamily: font, fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontFamily: font, fontSize: 13, color: "#fff", display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.fill, display: "inline-block" }} />
          <span style={{ opacity: 0.7, minWidth: 90 }}>{p.name || p.dataKey}</span>
          <span style={{ fontWeight: 600 }}>£{Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

export default function Page() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("All");
  const [view, setView] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [prods, prs] = await Promise.all([
          fetchSB("/produkter?active=eq.true&select=product_id,brand,product,category,type"),
          fetchSB("/prices?select=product_id,price,in_stock,scraped_at&order=scraped_at.desc"),
        ]);
        const latestMap = {};
        for (const p of prs) { if (!latestMap[p.product_id]) latestMap[p.product_id] = p; }
        const merged = prods.map(prod => {
          const pr = latestMap[prod.product_id];
          return { ...prod, price: pr ? Number(pr.price) : null, inStock: pr ? pr.in_stock : false, scrapedAt: pr ? pr.scraped_at : null };
        }).filter(p => p.price !== null);
        setProducts(merged);
        if (prs.length > 0) setLastUpdated(prs[0].scraped_at);
        setLoading(false);
      } catch (e) { setError(e.message); setLoading(false); }
    }
    load();
  }, []);

  const filtered = useMemo(() => category === "All" ? products : products.filter(p => p.category === category), [category, products]);
  const own = filtered.filter(p => p.type === "own");
  const comp = filtered.filter(p => p.type === "competitor");
  const avgOwn = own.length ? own.reduce((s, p) => s + p.price, 0) / own.length : 0;
  const avgComp = comp.length ? comp.reduce((s, p) => s + p.price, 0) / comp.length : 0;
  const priceIndex = avgComp > 0 ? Math.round((avgOwn / avgComp) * 100) : 0;
  const maxPrice = Math.max(...filtered.map(p => p.price), 1);

  const catData = CATEGORIES.filter(c => c !== "All").map(cat => {
    const o = products.filter(p => p.category === cat && p.type === "own");
    const c = products.filter(p => p.category === cat && p.type === "competitor");
    return {
      category: cat,
      E45: o.length ? Math.round(o.reduce((s, p) => s + p.price, 0) / o.length * 100) / 100 : 0,
      Competitors: c.length ? Math.round(c.reduce((s, p) => s + p.price, 0) / c.length * 100) / 100 : 0,
    };
  });

  const insights = useMemo(() => {
    return CATEGORIES.filter(c => c !== "All").map(cat => {
      const o = products.filter(p => p.category === cat && p.type === "own");
      const c = products.filter(p => p.category === cat && p.type === "competitor");
      if (!o.length || !c.length) return null;
      const aO = o.reduce((s, p) => s + p.price, 0) / o.length;
      const aC = c.reduce((s, p) => s + p.price, 0) / c.length;
      const diff = Math.round((1 - aO / aC) * 100);
      return { cat, diff: Math.abs(diff), direction: diff > 0 ? "below" : "above", color: diff > 0 ? "#059669" : "#B91C1C" };
    }).filter(Boolean);
  }, [products]);

  if (loading) return (
    <div style={{ fontFamily: font, background: T.bg, minHeight: "100vh" }}>
      <div style={{ background: T.primary, padding: "32px 36px 24px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: T.secondary, marginBottom: 6 }}>Karo Healthcare UK</div>
        <div style={{ fontSize: 28, fontWeight: 600, color: "#fff", letterSpacing: "-0.03em" }}>Price Intelligence</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: T.muted }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${T.divider}`, borderTopColor: T.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          Loading live data...
        </div>
      </div>
    </div>
  );

  if (error) return <div style={{ fontFamily: font, padding: 40, color: "#B91C1C" }}>Error: {error}</div>;

  return (
    <div style={{ fontFamily: font, background: T.bg, minHeight: "100vh", color: T.text }}>
      <div style={{ background: T.primary, padding: "32px 36px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(250,215,194,0.06)" }} />
        <div style={{ position: "absolute", bottom: -60, right: 80, width: 140, height: 140, borderRadius: "50%", background: "rgba(250,215,194,0.04)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: T.secondary, marginBottom: 6, opacity: 0.85 }}>Karo Healthcare UK</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15 }}>Price Intelligence</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
                Boots UK · {products.length} products · Live
                {lastUpdated && ` · ${new Date(lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 3 }}>
              {["overview", "compare", "detail"].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: "7px 18px", borderRadius: 6, border: "none",
                  background: view === v ? T.secondary : "transparent",
                  color: view === v ? T.primary : "rgba(255,255,255,0.6)",
                  cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: font, textTransform: "capitalize",
                }}>{v}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 22, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                padding: "6px 16px", borderRadius: 6, border: "none",
                background: category === cat ? T.secondary : "rgba(255,255,255,0.07)",
                color: category === cat ? T.primary : "rgba(255,255,255,0.55)",
                cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: font,
              }}>{cat}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 36px", maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
          <StatCard label="E45 Average" value={fmt(avgOwn)} sub={`${own.length} products`} highlight />
          <StatCard label="Competitor Average" value={fmt(avgComp)} sub={`${comp.length} products`} />
          <StatCard label="Price Index" value={priceIndex} sub={priceIndex < 100 ? "E45 below competitors" : priceIndex > 100 ? "E45 above competitors" : "At parity"} />
          <StatCard label="In Stock" value={`${filtered.filter(p => p.inStock).length}/${filtered.length}`} sub="Available on boots.com" />
        </div>

        {view === "overview" && (
          <>
            {insights.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(insights.length, 4)}, 1fr)`, gap: 12, marginBottom: 20 }}>
                {insights.map(ins => (
                  <div key={ins.cat} style={{ padding: "14px 18px", background: `${T.secondary}40`, borderRadius: 8, borderLeft: `3px solid ${ins.color}`, fontSize: 13, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>{ins.cat}:</span> E45 is <span style={{ fontWeight: 700, color: ins.color }}>{ins.diff}% {ins.direction}</span> competitors
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: T.card, borderRadius: 10, padding: 28, border: `1px solid ${T.divider}`, marginBottom: 20 }}>
              <SectionTitle title="Average Price by Category" subtitle="E45 vs competitor average on boots.com" />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={catData} barGap={6} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: T.muted, fontFamily: font }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted, fontFamily: font }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: font, paddingTop: 12 }} />
                  <Bar dataKey="E45" fill={T.primary} radius={[4, 4, 0, 0]} maxBarSize={44} />
                  <Bar dataKey="Competitors" fill={T.secondary} radius={[4, 4, 0, 0]} maxBarSize={44} stroke={T.accent} strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.card, borderRadius: 10, padding: 28, border: `1px solid ${T.divider}` }}>
              <SectionTitle title={`Product Prices — ${category}`} subtitle={`${filtered.length} products · sorted by price`} />
              <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 12, color: T.muted }}>
                <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: T.primary, marginRight: 5, verticalAlign: "middle" }} />E45</span>
                <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: T.secondary, border: `1px solid ${T.accent}`, marginRight: 5, verticalAlign: "middle" }} />Competitors</span>
              </div>
              {[...filtered].sort((a, b) => b.price - a.price).map(p => {
                const w = (p.price / maxPrice) * 100;
                const isOwn = p.type === "own";
                return (
                  <div key={p.product_id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 180, fontSize: 12, color: T.text, fontWeight: isOwn ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.product}</div>
                    <div style={{ flex: 1, background: "#f4f3f1", borderRadius: 5, height: 30, overflow: "hidden" }}>
                      <div style={{
                        width: `${w}%`, height: "100%",
                        background: isOwn ? `linear-gradient(90deg, ${T.primary}, #2a1f5e)` : T.secondary,
                        borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10,
                        border: isOwn ? "none" : `1px solid ${T.accent}`,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: font, color: isOwn ? "#fff" : T.primary }}>{fmt(p.price)}</span>
                      </div>
                    </div>
                    <div style={{ width: 50 }}>{!p.inStock && <Badge color="#B91C1C" filled>OOS</Badge>}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === "compare" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {CATEGORIES.filter(c => c !== "All").map(cat => {
              const catProds = products.filter(p => p.category === cat);
              if (!catProds.length) return null;
              const ownP = catProds.filter(p => p.type === "own").sort((a, b) => a.price - b.price);
              const compP = catProds.filter(p => p.type === "competitor").sort((a, b) => a.price - b.price);
              const catMax = Math.max(...catProds.map(p => p.price), 1);
              return (
                <div key={cat} style={{ background: T.card, borderRadius: 10, padding: 28, border: `1px solid ${T.divider}` }}>
                  <SectionTitle title={cat} subtitle={`${ownP.length} E45 vs ${compP.length} competitors`} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: T.primary, marginBottom: 12 }}>E45</div>
                      {ownP.map(p => (
                        <div key={p.product_id} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600 }}>{p.product}</span>
                            <span style={{ fontWeight: 700 }}>{fmt(p.price)}</span>
                          </div>
                          <div style={{ background: "#f4f3f1", borderRadius: 4, height: 8 }}>
                            <div style={{ width: `${(p.price / catMax) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${T.primary}, #2a1f5e)`, borderRadius: 4 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: T.muted, marginBottom: 12 }}>Competitors</div>
                      {compP.map(p => (
                        <div key={p.product_id} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span>{p.product}</span>
                            <span style={{ fontWeight: 700 }}>{fmt(p.price)}</span>
                          </div>
                          <div style={{ background: "#f4f3f1", borderRadius: 4, height: 8 }}>
                            <div style={{ width: `${(p.price / catMax) * 100}%`, height: "100%", background: T.secondary, borderRadius: 4, border: `1px solid ${T.accent}` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "detail" && (
          <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.divider}`, overflow: "hidden" }}>
            <div style={{ padding: "22px 28px 14px" }}>
              <SectionTitle title={`Product Detail — ${category}`} subtitle={`${filtered.length} products · live prices`} />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: font }}>
                <thead>
                  <tr style={{ borderTop: `1px solid ${T.divider}`, borderBottom: `1px solid ${T.divider}`, background: "#fafaf8" }}>
                    {["Product", "Brand", "Category", "Type", "Price", "Stock"].map(h => (
                      <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: T.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => {
                    if (a.category !== b.category) return a.category.localeCompare(b.category);
                    if (a.type !== b.type) return a.type === "own" ? -1 : 1;
                    return a.price - b.price;
                  }).map(p => {
                    const isOwn = p.type === "own";
                    return (
                      <tr key={p.product_id} style={{ borderBottom: `1px solid ${T.divider}`, background: isOwn ? `${T.secondary}18` : "transparent" }}>
                        <td style={{ padding: "12px 20px", fontWeight: isOwn ? 600 : 400, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.product}</td>
                        <td style={{ padding: "12px 20px" }}><Badge color={BRAND_COLORS[p.brand] || T.muted} filled={isOwn}>{p.brand}</Badge></td>
                        <td style={{ padding: "12px 20px", color: T.muted, fontSize: 12 }}>{p.category}</td>
                        <td style={{ padding: "12px 20px" }}><Badge color={isOwn ? T.primary : T.muted}>{p.type}</Badge></td>
                        <td style={{ padding: "12px 20px", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 14 }}>{fmt(p.price)}</td>
                        <td style={{ padding: "12px 20px" }}>
                          {p.inStock
                            ? <span style={{ color: "#059669", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>In Stock</span>
                            : <Badge color="#B91C1C" filled>OOS</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", padding: "28px 0 12px", fontSize: 11, color: T.muted, letterSpacing: "0.02em" }}>
          Live data from boots.com via Supabase · Scraped daily at 03:00 UTC · Prices in GBP
        </div>
      </div>
    </div>
  );
}
