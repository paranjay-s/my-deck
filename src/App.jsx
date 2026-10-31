import React, { useState, useEffect, useRef, useMemo, useId, useCallback } from "react";

/* Rename the product here. Everything else updates. */
const PRODUCT = "Planwise";

/* ───────────── helpers ───────────── */
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const usd = n => "$" + Math.round(n).toLocaleString();
const cx = (...a) => a.filter(Boolean).join(" ");

function useTween(target, dur = 700, init) {
  const start = init === undefined ? target : init;
  const [v, setV] = useState(start);
  const ref = useRef(start);
  useEffect(() => {
    const from = ref.current, t0 = performance.now(); let raf;
    const step = t => { const p = clamp((t - t0) / dur); ref.current = from + (target - from) * (1 - Math.pow(1 - p, 3)); setV(ref.current); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}
function Count({ to, prefix = "", suffix = "", dec = 0 }) {
  const v = useTween(to, 900, 0);
  return <>{prefix}{v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}{suffix}</>;
}
function useTick(ms, n) {
  const [k, setK] = useState(0);
  useEffect(() => { const t = setInterval(() => setK(x => (x + 1) % n), ms); return () => clearInterval(t); }, [ms, n]);
  return [k, setK];
}
function useTyped(text, ms = 22) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); const t = setInterval(() => setN(x => { if (x >= text.length) { clearInterval(t); return x; } return x + 1; }), ms); return () => clearInterval(t); }, [text, ms]);
  return text.slice(0, n);
}

/* ───────────── data ───────────── */
const ROOMS = [
  { id: "living", name: "Living", x: 10, y: 10, w: 170, h: 140, cost: 4200 },
  { id: "kitchen", name: "Kitchen", x: 180, y: 10, w: 110, h: 140, cost: 6800 },
  { id: "bath", name: "Bath", x: 290, y: 10, w: 100, h: 70, cost: 3900 },
  { id: "bed2", name: "Bed 2", x: 290, y: 80, w: 100, h: 70, cost: 1600 },
  { id: "bed1", name: "Bed 1", x: 10, y: 150, w: 150, h: 120, cost: 2400 },
  { id: "hall", name: "Hall", x: 160, y: 150, w: 70, h: 120, cost: 900 },
  { id: "master", name: "Master", x: 230, y: 150, w: 160, h: 120, cost: 3100 },
];
const area = r => +(r.w * r.h * 0.0009).toFixed(2);
const RN = Object.fromEntries(ROOMS.map(r => [r.id, r.name]));
const ITEM = { living: "Oak flooring", kitchen: "Quartz + tile", bath: "Wall + floor tile", bed2: "Carpet", bed1: "Carpet", hall: "Vinyl plank", master: "Carpet" };
const ROWS = ROOMS.map(r => ({ room: r.id, item: ITEM[r.id], unit: "m²", qty: area(r), rate: r.cost / area(r) }));
const TOTAL = ROOMS.reduce((a, r) => a + r.cost, 0);
const FLOOR = { marble: "url(#p-marble)", tile: "url(#p-tile)", wood: "url(#p-wood)", concrete: "url(#p-concrete)", carpet: "url(#p-carpet)", herring: "url(#p-herring)" };
const RATE = { marble: 150, wood: 85, tile: 45, concrete: 30, carpet: 38, herring: 110 };
const MNAME = { marble: "Italian marble", wood: "Oak wood", tile: "Ceramic tile", concrete: "Polished concrete", carpet: "Carpet", herring: "Herringbone oak" };
const FURN = {
  living: [[40, 40, 70, 28, 12, "#2B4C7E"], [60, 95, 30, 20, 6, "#C99A63"]],
  kitchen: [[188, 14, 100, 14, 16, "#8793A6"], [210, 80, 50, 22, 13, "#C99A63"]],
  bath: [[296, 14, 56, 24, 10, "#FFFFFF"]],
  bed2: [[304, 92, 52, 44, 8, "#7FA6D6"]],
  bed1: [[24, 175, 62, 60, 8, "#D9A27A"]],
  master: [[260, 180, 74, 64, 9, "#5B8DD6"]],
};

/* ───────────── svg defs (textures) ───────────── */
function Defs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <pattern id="p-marble" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#EFEBE6" /><path d="M0 40C14 28 26 46 60 22M12 0C20 18 34 14 40 60" stroke="#B7AEA3" strokeWidth="1.1" fill="none" /></pattern>
        <pattern id="p-tile" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#DCE5EC" /><path d="M0 0H24V24" stroke="#AEBBC8" strokeWidth="1.2" fill="none" /></pattern>
        <pattern id="p-wood" width="48" height="24" patternUnits="userSpaceOnUse"><rect width="48" height="24" fill="#CFA06A" /><path d="M0 12H48M0 0H48M16 0V12M32 12V24" stroke="#A97B47" strokeWidth="1.2" /></pattern>
        <pattern id="p-concrete" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#A9AFB5" /><circle cx="8" cy="10" r="1.2" fill="#8D949B" /><circle cx="27" cy="22" r="1.4" fill="#8D949B" /><circle cx="15" cy="33" r="1" fill="#C0C5CA" /></pattern>
        <pattern id="p-carpet" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#98A6C9" /><circle cx="2" cy="2" r="1" fill="#8997BC" /><circle cx="6" cy="6" r="1" fill="#8997BC" /></pattern>
        <pattern id="p-brick" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#B5674F" /><path d="M0 10H40M0 0H40M20 0V10M0 10V20M40 10V20" stroke="#7B3F2F" strokeWidth="1.5" fill="none" /></pattern>
        <pattern id="p-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" stroke="rgba(20,48,90,.45)" strokeWidth="1" fill="none" /></pattern>
        <pattern id="p-herring" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#C9985F" /><path d="M0 0L12 12L24 0M0 12L12 24L24 12" stroke="#8E6030" strokeWidth="1.4" fill="none" /></pattern>
      </defs>
    </svg>
  );
}

/* ───────────── 2D plan ───────────── */
function Plan({ fills = {}, hl, hlSet = [], dims, sub = {}, unit = "m", draw, onRoom, open = 0, style }) {
  const f = unit === "ft" ? 3.281 : 1;
  const hs = ROOMS.filter(r => r.id === hl || hlSet.includes(r.id));
  return (
    <svg viewBox="-4 -4 408 288" style={{ width: "100%", display: "block", overflow: "visible", ...style }}>
      {ROOMS.map((r, i) => {
        const d = draw ? { animationDelay: `${i * 0.18}s` } : {};
        const fd = draw ? { animationDelay: `${1.2 + i * 0.15}s` } : {};
        const s2 = sub[r.id] || (dims ? `${(r.w * 0.03 * f).toFixed(1)} × ${(r.h * 0.03 * f).toFixed(1)} ${unit}` : null);
        return (
          <g key={r.id} onClick={onRoom ? () => onRoom(r.id) : undefined} style={{ cursor: onRoom ? "pointer" : "default" }}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} className={draw ? "fi" : ""} style={{ fill: fills[r.id] || "var(--roomfill)", transition: "fill .5s", ...fd }} />
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" pathLength="1" strokeWidth="3" strokeLinejoin="round" className={draw ? "draw" : ""} style={{ stroke: "var(--ink)", ...d }} />
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 + (s2 ? -2 : 5)} textAnchor="middle" className={cx("hand", draw && "fi")} style={{ fill: "var(--ink)", fontSize: 17, pointerEvents: "none", ...fd }}>{r.name}</text>
            {s2 && <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 13} textAnchor="middle" className={draw ? "fi" : ""} style={{ fill: "var(--ink)", fontSize: 10.5, opacity: 0.85, pointerEvents: "none", ...fd }}>{s2}</text>}
          </g>
        );
      })}
      {open > 0 && <line x1="180" y1="13" x2="180" y2="147" strokeWidth="7" style={{ stroke: "var(--roomfill)", opacity: open }} />}
      {hs.map(r => <rect key={"h" + r.id} className="neon" x={r.x} y={r.y} width={r.w} height={r.h} rx="2" />)}
    </svg>
  );
}

/* ───────────── isometric 3D ───────────── */
function Iso({ fills = {}, rise = 1, wallH = 46, intH = 14, open = 0, hl, furn = true, style }) {
  const P = (x, y, z = 0) => `${((x - y) * 0.866).toFixed(1)},${((x + y) * 0.5 - z).toFixed(1)}`;
  const poly = (a, fill, sw = 1.4) => <polygon points={a.join(" ")} style={{ fill, stroke: "var(--ink)", strokeWidth: sw, strokeLinejoin: "round", transition: "fill .5s" }} />;
  const box = (k, x, y, w, h, z, c) => {
    z *= rise;
    return (
      <g key={k}>
        {poly([P(x + w, y, 0), P(x + w, y + h, 0), P(x + w, y + h, z), P(x + w, y, z)], mix(c, "#000000", 0.22), 1)}
        {poly([P(x, y + h, 0), P(x + w, y + h, 0), P(x + w, y + h, z), P(x, y + h, z)], mix(c, "#000000", 0.1), 1)}
        {poly([P(x, y, z), P(x + w, y, z), P(x + w, y + h, z), P(x, y + h, z)], c, 1)}
      </g>
    );
  };
  const order = [...ROOMS].sort((a, b) => a.x + a.w / 2 + a.y + a.h / 2 - (b.x + b.w / 2 + b.y + b.h / 2));
  return (
    <svg viewBox="-240 -60 590 410" style={{ width: "100%", display: "block", ...style }}>
      {order.map(r => {
        const { x, y, w, h } = r;
        const zt = (y === 10 ? wallH : intH) * rise;
        let zl = (x === 10 ? wallH : intH) * rise;
        if (r.id === "kitchen") zl *= 1 - open;
        return (
          <g key={r.id}>
            {poly([P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)], fills[r.id] || "var(--floordef)")}
            {hl === r.id && <polygon className="neon" points={[P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)].join(" ")} />}
            {poly([P(x, y, 0), P(x + w, y, 0), P(x + w, y, zt), P(x, y, zt)], "var(--wa)")}
            {zl > 0.5 && poly([P(x, y, 0), P(x, y + h, 0), P(x, y + h, zl), P(x, y, zl)], "var(--wb)")}
            {x + w === 390 && poly([P(x + w, y, 0), P(x + w, y + h, 0), P(x + w, y + h, 5 * rise), P(x + w, y, 5 * rise)], "var(--wb)")}
            {y + h === 270 && poly([P(x, y + h, 0), P(x + w, y + h, 0), P(x + w, y + h, 5 * rise), P(x, y + h, 5 * rise)], "var(--wa)")}
            {furn && FURN[r.id] && FURN[r.id].map((b, i) => box(i, ...b))}
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────── perspective room "render" ───────────── */
const STY = {
  luxury: { n: "Dubai Penthouse", wall: "#E9DFD0", w2: "#D6C8B1", pat: "p-marble", sofa: "#1F2A44", acc: "#C9A24B", lt: "#FFD9A0", rug: "#8A6B2F", cur: true },
  scandi: { n: "Minimalist Scandi", wall: "#F4F4F2", w2: "#E2E5E8", pat: "p-wood", sofa: "#9DB4C0", acc: "#2F5D50", lt: "#FFF1D6", rug: "#EAE5DB" },
  loft: { n: "Industrial Loft", wall: "#A8604A", w2: "#8C4B3A", pat: "p-concrete", sofa: "#3B3F46", acc: "#E0A030", lt: "#FFC27A", rug: "#2D3036", brick: true },
  rental: { n: "Cost-Saver Rental", wall: "#F2F2F0", w2: "#E2E2E0", pat: "p-tile", sofa: "#B7C1CC", acc: "#6B7A8F", lt: "#FFFFFF", rug: "#CBD3DB" },
};
function Room3D({ s = "luxury", t = 0.4, skylight = false, led, wire, style }) {
  const S = STY[s], id = useId().replace(/:/g, "");
  const hr = 6 + t * 16;
  const day = hr > 20 ? 0 : Math.max(0, Math.sin(Math.PI * (hr - 6) / 14));
  const skyC = mix(mix("#0F1B38", "#F5A56B", clamp(day * 3)), "#8EC8F0", clamp((day - 0.3) / 0.7));
  const lt = led === "cool" ? "#CFE6FF" : S.lt;
  const dx = (0.5 - t) * 300;
  return (
    <svg viewBox="0 0 600 380" style={{ width: "100%", display: "block", filter: wire ? "grayscale(1) contrast(1.15) brightness(1.05)" : undefined, ...style }}>
      <defs>
        <radialGradient id={"g" + id}><stop offset="0" stopColor={lt} stopOpacity=".95" /><stop offset="1" stopColor={lt} stopOpacity="0" /></radialGradient>
        <linearGradient id={"s" + id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={skyC} /><stop offset="1" stopColor={mix(skyC, "#FFFFFF", 0.45)} /></linearGradient>
      </defs>
      <polygon points="0,0 600,0 500,50 100,50" fill={mix(S.wall, "#FFFFFF", 0.35)} />
      <polygon points="0,0 100,50 100,250 0,380" fill={S.w2} />
      <polygon points="600,0 500,50 500,250 600,380" fill={S.w2} />
      <rect x="100" y="50" width="400" height="200" fill={S.wall} />
      {S.brick && <rect x="100" y="50" width="400" height="200" fill="url(#p-brick)" opacity=".6" />}
      <polygon points="0,380 100,250 500,250 600,380" fill={`url(#${S.pat})`} />
      {[100, 150, 200, 250, 300, 350, 400, 450, 500].map(x => <line key={x} x1={x} y1="250" x2={300 + (x - 300) * 1.5} y2="380" stroke="#000" strokeOpacity=".08" />)}
      {[272, 300, 334].map(y => <line key={y} x1={100 - (y - 250) * 100 / 130} y1={y} x2={500 + (y - 250) * 100 / 130} y2={y} stroke="#000" strokeOpacity=".08" />)}
      <rect x="190" y="88" width="120" height="112" fill={`url(#s${id})`} stroke={S.acc} strokeWidth="5" />
      {day > 0.05 && <circle cx={205 + t * 90} cy={175 - day * 55} r="9" fill="#FFF3B0" opacity={day} />}
      <path d="M250 88V200M190 144H310" stroke={S.acc} strokeWidth="3" />
      {S.cur && <><rect x="168" y="80" width="20" height="130" fill={S.acc} opacity=".8" /><rect x="312" y="80" width="20" height="130" fill={S.acc} opacity=".8" /></>}
      {skylight && <><polygon points="230,12 370,12 355,40 245,40" fill={`url(#s${id})`} stroke={S.acc} strokeWidth="3" /><polygon points="245,40 355,40 440,310 170,310" fill="#FFF4C8" opacity={day * 0.16} /></>}
      <polygon points={`${180 + dx * 0.4},250 ${320 + dx * 0.4},250 ${400 + dx},360 ${150 + dx},360`} fill="#FFF4C8" opacity={day * 0.38} />
      <rect x="350" y="100" width="64" height="84" fill={S.acc} opacity=".85" stroke={mix(S.wall, "#000000", 0.3)} strokeWidth="3" />
      <rect x="360" y="110" width="44" height="64" fill={mix(S.acc, "#FFFFFF", 0.5)} />
      <ellipse cx="300" cy="322" rx="160" ry="30" fill={S.rug} opacity=".9" />
      <rect x="205" y="205" width="190" height="55" rx="12" fill={mix(S.sofa, "#000000", 0.15)} />
      <rect x="180" y="222" width="30" height="68" rx="14" fill={S.sofa} />
      <rect x="390" y="222" width="30" height="68" rx="14" fill={S.sofa} />
      <rect x="195" y="245" width="210" height="44" rx="14" fill={S.sofa} />
      <rect x="225" y="222" width="36" height="32" rx="8" fill={S.acc} />
      <rect x="340" y="222" width="36" height="32" rx="8" fill={S.acc} />
      <rect x="255" y="318" width="90" height="22" rx="4" fill={mix(S.acc, "#FFFFFF", 0.2)} />
      <path d="M262 340V352M338 340V352" stroke="#000" strokeOpacity=".35" strokeWidth="3" />
      <polygon points="460,300 490,300 484,340 466,340" fill="#B0764E" />
      <g fill="#3F8F5A"><ellipse cx="475" cy="268" rx="11" ry="34" /><ellipse cx="457" cy="280" rx="9" ry="26" transform="rotate(-25 457 280)" /><ellipse cx="494" cy="282" rx="9" ry="26" transform="rotate(25 494 282)" /></g>
      <rect width="600" height="380" fill="#0B1530" opacity={(1 - day) * 0.5} />
      <line x1="420" y1="50" x2="420" y2="110" stroke="#222" strokeWidth="2" />
      <circle cx="420" cy="130" r="95" fill={`url(#g${id})`} opacity={0.3 + (1 - day) * 0.55} />
      <path d="M396 128L404 108H436L444 128Z" fill={S.acc} />
      {wire && <rect width="600" height="380" fill="url(#p-grid)" opacity=".55" />}
    </svg>
  );
}

/* ───────────── ui atoms ───────────── */
const Win = ({ title, children, style, right, body }) => (
  <div className="win" style={style}>
    <div className="wbar"><i /><i /><i /><span>{title}</span><span style={{ marginLeft: "auto" }}>{right}</span></div>
    <div style={{ padding: 12, ...body }}>{children}</div>
  </div>
);
const Head = ({ tag, children }) => <div><div className="hand note">{tag}</div><h2 className="disp">{children}</h2></div>;
function Feat({ tag, title, pts, note, children }) {
  return (
    <div className="g2">
      <div>
        <Head tag={tag}>{title}</Head>
        <ul className="bl" style={{ marginTop: 18 }}>{pts.map(p => <li key={p}>{p}</li>)}</ul>
        {note && <div className="hand sticky" style={{ marginTop: 22 }}>{note}</div>}
      </div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}
function Sheet({ hl, onRow, q, onQ }) {
  return (
    <div className="tbl">
      <div className="trow th"><span>Item</span><span>Qty</span><span>Cost</span></div>
      {ROWS.map(r => {
        const qty = q ? q[r.room] : r.qty;
        return (
          <div key={r.room} className={cx("trow", onRow && "clk", hl === r.room && "on")} onClick={onRow ? () => onRow(r.room) : undefined}>
            <span><b>{r.item}</b><small>{RN[r.room]}</small></span>
            <span>{onQ ? <input className="qi noswipe" type="number" step="0.1" value={qty} onChange={e => onQ(r.room, +e.target.value || 0)} /> : qty.toFixed(1)} {r.unit}</span>
            <span>{usd(qty * r.rate)}</span>
          </div>
        );
      })}
    </div>
  );
}
const Bar = ({ p, c }) => { const w = useTween(p, 800, 0); return <div className="trk"><div style={{ width: w + "%", background: c }} /></div>; };
const Switch = ({ on, set, label }) => <button className={cx("sw", on && "on")} role="switch" aria-checked={on} aria-label={label} onClick={() => set(!on)} />;

/* ───────────── 1. hero ───────────── */
function Hero() {
  const [ph, setPh] = useState(0), [run, setRun] = useState(0);
  useEffect(() => { const t = setTimeout(() => setPh(1), 3500); return () => clearTimeout(t); }, [ph, run]);
  const rise = useTween(ph ? 1 : 0, 2000, 0);
  return (
    <div className="g2" style={{ minHeight: "calc(100vh - 190px)" }}>
      <div>
        <div className="hand note">{PRODUCT}</div>
        <h1 className="disp">Plan in.<br />Home out.</h1>
        <p className="lead">Drop in a flat 2D floor plan. Get a 3D home, an exact materials list and a live budget in minutes.</p>
        <div className="row"><span className="chip">$99 / month</span><span className="chip">Works worldwide</span><span className="chip">Homebuyers, flippers, agents</span></div>
        <div style={{ marginTop: 22 }}><button className="btn" onClick={() => { setPh(0); setRun(r => r + 1); }}>Replay the build</button></div>
      </div>
      <div style={{ position: "relative" }}>
        <div key={run} style={{ opacity: ph ? 0 : 1, transition: "opacity .9s" }}><Plan draw dims /></div>
        <div style={{ position: "absolute", inset: 0, opacity: ph ? 1 : 0, transition: "opacity .9s" }}><Iso rise={rise} /></div>
      </div>
    </div>
  );
}

/* ───────────── 2. big idea ───────────── */
function Idea() {
  const r = useTween(1, 1800, 0);
  return (
    <>
      <Head tag="the big idea">One floor plan.<br />Three results.</Head>
      <div className="g3">
        <Win title="Interactive 3D home"><Iso rise={r} /><p className="cap">Built straight from the flat plan.</p></Win>
        <Win title="Material + labor calculator">
          <div className="tbl">{[["Bricks", 12480], ["Cement bags", 86], ["Floor tiles", 410], ["Worker hours", 312]].map(([n, v]) => <div className="trow two" key={n}><span>{n}</span><b><Count to={v} /></b></div>)}</div>
          <p className="cap">Exact quantities. No guessing.</p>
        </Win>
        <Win title="Live budget">
          <div className="disp" style={{ fontSize: 46, margin: "10px 0" }}><Count to={TOTAL} prefix="$" /></div>
          <Bar p={(TOTAL / 30000) * 100} c="var(--org)" />
          <small>of a $30,000 budget</small>
          <p className="cap">Moves as you change anything.</p>
        </Win>
      </div>
      <div className="hand sticky" style={{ alignSelf: "flex-start" }}>$99 a month. Worldwide.</div>
    </>
  );
}

/* ───────────── 3. who ───────────── */
function Who() {
  const ic = [
    <path key="a" d="M6 24L28 6L50 24V48H6ZM24 48V32H34V48" />,
    <path key="b" d="M10 22a18 18 0 0 1 32-6M46 34a18 18 0 0 1-32 6M42 8V18H32M14 48V38H24" />,
    <path key="c" d="M14 6V50M14 10H46L40 20L46 30H14" />,
  ];
  const P = [["Homebuyers", "See it before it is built"], ["Property flippers", "Know the margin first"], ["Real estate agents", "Quote in minutes"]];
  return (
    <>
      <Head tag="who it is for">Built for people who decide fast</Head>
      <div className="g3">
        {P.map(([a, b], i) => (
          <div className="card" key={a}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--org)" }}>{ic[i]}</svg>
            <h3 className="disp" style={{ fontSize: 26, margin: "12px 0 4px" }}>{a}</h3><span>{b}</span>
          </div>
        ))}
      </div>
      <div className="g2e">
        <div><h3 className="disp" style={{ fontSize: 28 }}>Instant estimates</h3><ul className="bl" style={{ marginTop: 12 }}><li>Exact materials list</li><li>Worker hours</li><li>3D model, in minutes</li></ul></div>
        <div><h3 className="disp" style={{ fontSize: 28 }}>Total control</h3><ul className="bl" style={{ marginTop: 12 }}><li>Test design changes</li><li>Cut costs in real time</li><li>Before construction starts</li></ul></div>
      </div>
    </>
  );
}

/* ───────────── 4. steps ───────────── */
const S1 = () => (
  <div className="stage"><div className="dz"><div className="hand" style={{ fontSize: 28 }}>Drop floor plan here</div><div className="fileb">floorplan.pdf</div></div><div className="stripe pop" style={{ animationDelay: "1.3s" }}>Stripe subscription <b>Active</b></div></div>
);
const S2 = () => <div style={{ position: "relative" }}><Plan draw dims /><div className="scanl" /></div>;
const S3 = () => (
  <div className="stage"><div className="tbl" style={{ width: "100%" }}>{[["Bricks", 12480, "wall area ÷ brick size"], ["Cement bags", 86, "volume × mix ratio"], ["Floor tiles", 410, "floor area ÷ tile size"], ["Worker hours", 312, "task × crew rate"]].map(([n, v, f]) => <div className="trow" key={n} style={{ gridTemplateColumns: "1fr 1fr 1fr" }}><b>{n}</b><small style={{ opacity: 0.7 }}>{f}</small><b style={{ textAlign: "right", fontSize: 20 }}><Count to={v} /></b></div>)}</div><span className="chip on">Plain Python, no AI guessing</span></div>
);
const S4 = () => (
  <svg viewBox="0 0 400 240" style={{ width: "100%" }}>
    <rect x="30" y="30" width="140" height="110" fill="none" strokeWidth="3" style={{ stroke: "var(--ink)" }} />
    <polygon points="230,30 360,30 360,85 305,85 305,140 230,140" fill="none" strokeWidth="3" style={{ stroke: "var(--ink)" }} />
    <path d="M305 85L330 85L305 110Z" fill="var(--org)" opacity=".7" className="pop" style={{ animationDelay: ".6s" }} />
    <text x="100" y="92" textAnchor="middle" className="hand" style={{ fill: "var(--ink)", fontSize: 20 }}>Simple</text>
    <text x="290" y="62" textAnchor="middle" className="hand" style={{ fill: "var(--ink)", fontSize: 20 }}>Tricky angles</text>
    <g className="pop" style={{ animationDelay: ".3s" }}><rect x="65" y="156" width="70" height="30" rx="15" fill="#2F9E6B" /><text x="100" y="176" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="15">+5%</text></g>
    <g className="pop" style={{ animationDelay: ".9s" }}><rect x="255" y="156" width="70" height="30" rx="15" fill="#FF5B1F" /><text x="290" y="176" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="15">+15%</text></g>
    <text x="200" y="224" textAnchor="middle" fontSize="12" style={{ fill: "var(--ink)" }}>ML reads corners and angles, adds the extra for cuts</text>
  </svg>
);
function S5() {
  const r = useTween(1, 1400, 0);
  return <div className="ws"><div><div className="hand lab">2D plan</div><Plan hl="kitchen" /></div><div><div className="hand lab">3D house</div><Iso rise={r} /></div><div><div className="hand lab">Material sheet</div><Sheet hl="kitchen" /></div></div>;
}
function Steps() {
  const [k, setK] = useState(0), [auto, setAuto] = useState(true);
  useEffect(() => { if (!auto) return; const t = setInterval(() => setK(x => (x + 1) % 5), 4500); return () => clearInterval(t); }, [auto]);
  const L = [["Upload", "Log in, subscribe, drop a PDF or image."], ["AI reads it", "Rooms, wall lengths, exact positions."], ["Exact math", "Bricks, cement, tiles, worker hours."], ["Smart buffer", "Extra material for tricky cuts."], ["Live screen", "2D, 3D and sheet, side by side."]];
  const V = [S1, S2, S3, S4, S5][k];
  return (
    <>
      <Head tag="how it works">Five steps. Minutes.</Head>
      <div className="g2e" style={{ alignItems: "start" }}>
        <div className="tabs">{L.map(([a, b], i) => <button key={a} className={cx("tab", i === k && "on")} onClick={() => { setK(i); setAuto(false); }}><b>{i + 1}. {a}</b><small>{b}</small></button>)}</div>
        <Win title={L[k][0]} right={<button className="btn sm" onClick={() => setAuto(a => !a)}>{auto ? "Pause" : "Auto-play"}</button>}><div key={k}><V /></div></Win>
      </div>
    </>
  );
}

/* ───────────── 5. live workspace ───────────── */
function Workspace() {
  const [hl, setHl] = useState("kitchen");
  const [q, setQ] = useState(() => Object.fromEntries(ROWS.map(r => [r.room, r.qty])));
  const total = ROWS.reduce((a, r) => a + q[r.room] * r.rate, 0);
  const r3 = useTween(1, 1800, 0);
  return (
    <>
      <Head tag="the live screen">Everything on one screen</Head>
      <Win title={`${PRODUCT} / 3-bed home`} right={<span className="chip sm">{usd(total)} of $30,000</span>}>
        <div className="ws">
          <div><div className="hand lab">2D plan</div><Plan hl={hl} onRoom={setHl} /></div>
          <div><div className="hand lab">Live 3D</div><Iso rise={r3} hl={hl} /></div>
          <div><div className="hand lab">Editable sheet</div><Sheet hl={hl} onRow={setHl} q={q} onQ={(k, v) => setQ(o => ({ ...o, [k]: v }))} /></div>
        </div>
        <div className="chatbar"><span className="hand">AI copilot</span><span>Swap kitchen floor to marble</span><span className="caret" /></div>
      </Win>
      <div className="hand" style={{ fontSize: 24 }}>Try it: click a room, or change a quantity.</div>
    </>
  );
}

/* ───────────── features ───────────── */
function ThreeD() {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 900); return () => clearTimeout(t); }, []);
  const r = useTween(on ? 1 : 0, 1800, 0);
  return (
    <Feat tag="the wow factor" title="2D plan becomes a 3D home" pts={["Built automatically from the plan", "Buyers see the finished layout", "Runs in the browser, no server load"]} note="Tap Build 3D">
      <Win title="Preview" right={<button className="btn sm" onClick={() => setOn(o => !o)}>{on ? "Back to 2D" : "Build 3D"}</button>}>
        <div style={{ position: "relative" }}>
          <div style={{ opacity: on ? 0 : 1, transition: "opacity .8s" }}><Plan dims /></div>
          <div style={{ position: "absolute", inset: 0, opacity: on ? 1 : 0, transition: "opacity .8s" }}><Iso rise={r} /></div>
        </div>
      </Win>
    </Feat>
  );
}

const FL0 = { living: "wood", kitchen: "tile", bath: "tile", bed1: "carpet", bed2: "carpet", master: "carpet", hall: "tile" };
function Chat() {
  const [fl, setFl] = useState(FL0), [log, setLog] = useState([]), [txt, setTxt] = useState(""), [flash, setFlash] = useState([]);
  const flRef = useRef(fl); flRef.current = fl;
  const total = ROOMS.reduce((a, r) => a + area(r) * RATE[fl[r.id]], 0);
  const send = m => {
    if (!m.trim()) return;
    setLog(l => [...l.slice(-3), { u: 1, m }]);
    const rooms = /bedrooms/i.test(m) ? ["bed1", "bed2", "master"] : Object.entries({ living: /living/i, kitchen: /kitchen/i, bath: /bath/i, bed1: /bed ?1|first bed/i, bed2: /bed ?2|second bed/i, master: /master/i, hall: /hall/i }).filter(([, re]) => re.test(m)).map(([k]) => k);
    const hit = Object.entries({ marble: /marble/i, wood: /wood|oak|timber/i, tile: /tile|ceramic/i, concrete: /concrete/i, carpet: /carpet/i }).find(([, re]) => re.test(m));
    setTimeout(() => {
      if (!rooms.length || !hit) { setLog(l => [...l.slice(-3), { m: "Try: Change kitchen floor to Italian marble" }]); return; }
      const mat = hit[0], cur = flRef.current;
      const delta = rooms.reduce((a, id) => a + area(ROOMS.find(r => r.id === id)) * (RATE[mat] - RATE[cur[id]]), 0);
      setFl(f => { const n = { ...f }; rooms.forEach(id => { n[id] = mat; }); return n; });
      setFlash(rooms); setTimeout(() => setFlash([]), 1800);
      setLog(l => [...l.slice(-3), { m: `${rooms.map(i => RN[i]).join(", ")} floor is now ${MNAME[mat]}. ${delta >= 0 ? "+" : "-"}${usd(Math.abs(delta))}. 3D and sheet updated.` }]);
    }, 700);
    setTxt("");
  };
  useEffect(() => { const t = setTimeout(() => send("Change kitchen floor to Italian marble"), 1200); return () => clearTimeout(t); }, []);
  const fills = Object.fromEntries(Object.entries(fl).map(([k, v]) => [k, FLOOR[v]]));
  return (
    <Feat tag="just ask" title="Type a change. See it happen." pts={["Plain-English commands", "3D floor swaps instantly", "Material math updates with it"]} note="Type your own, too">
      <Win title="Chat-to-Change" right={<b>{usd(total)}</b>}>
        <div className="g2e" style={{ gap: 12 }}>
          <Iso fills={fills} />
          <div className="tbl">{ROOMS.map(r => <div key={r.id} className={cx("trow", flash.includes(r.id) && "on")} style={{ gridTemplateColumns: "1fr 1.4fr .8fr" }}><b>{r.name}</b><span>{MNAME[fl[r.id]]}</span><span>{usd(area(r) * RATE[fl[r.id]])}</span></div>)}</div>
        </div>
        <div className="log">{log.map((l, i) => <div key={i} className={cx("bub", l.u && "u")}>{l.m}</div>)}</div>
        <div className="row" style={{ margin: "8px 0" }}>{["Change kitchen floor to Italian marble", "Make living room floor oak", "Bedrooms to carpet"].map(s => <button key={s} className="chip sm clk" onClick={() => send(s)}>{s}</button>)}</div>
        <div className="row"><input className="inp noswipe" value={txt} placeholder="Swap bath floor to marble" onChange={e => setTxt(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(txt); }} /><button className="btn sm pri" onClick={() => send(txt)}>Send</button></div>
      </Win>
    </Feat>
  );
}

function Verify() {
  const [hl, setHl] = useState("kitchen"), [auto, setAuto] = useState(true);
  useEffect(() => { if (!auto) return; const t = setInterval(() => setHl(h => ROOMS[(ROOMS.findIndex(r => r.id === h) + 1) % ROOMS.length].id), 2600); return () => clearInterval(t); }, [auto]);
  const r = ROOMS.find(x => x.id === hl);
  return (
    <Feat tag="trust the numbers" title="Click a row. The room lights up." pts={["Every row links to its room", "Neon box on the exact spot", "Proof the math is right"]} note="Tap any row">
      <Win title="Click-to-Verify">
        <div className="g2e" style={{ gap: 12 }}>
          <Plan hl={hl} onRoom={id => { setHl(id); setAuto(false); }} />
          <Sheet hl={hl} onRow={id => { setHl(id); setAuto(false); }} />
        </div>
        <div className="callout" key={hl}>{r.name}: {(r.w * 0.03).toFixed(1)} m × {(r.h * 0.03).toFixed(1)} m = <b>{area(r).toFixed(1)} m²</b> matches the sheet</div>
      </Win>
    </Feat>
  );
}

const PRE = {
  luxury: { n: "Dubai Penthouse", total: 84200, h: 620, f: { living: "marble", kitchen: "marble", bath: "marble", hall: "marble", bed1: "wood", bed2: "wood", master: "wood" }, sku: ["Italian marble", "Venetian plaster", "Brushed gold", "Smart lighting"] },
  loft: { n: "Industrial Loft", total: 46800, h: 410, f: { living: "concrete", kitchen: "concrete", bath: "concrete", hall: "concrete", bed1: "concrete", bed2: "concrete", master: "concrete" }, sku: ["Polished concrete", "Exposed brick", "Matte black", "Track lights"] },
  rental: { n: "Cost-Saver Rental", total: 21500, h: 260, f: { living: "tile", kitchen: "tile", bath: "tile", hall: "tile", bed1: "tile", bed2: "tile", master: "tile" }, sku: ["Ceramic tile", "White paint", "Chrome", "Standard LED"] },
};
function Presets() {
  const [p, setP] = useState("luxury");
  const D = PRE[p];
  const fills = Object.fromEntries(Object.entries(D.f).map(([k, v]) => [k, FLOOR[v]]));
  return (
    <Feat tag="one click" title="Pick a vibe. Pick a budget." pts={["Swaps every material at once", "3D, textures and lighting change", "Cost and labor hours recalculate"]} note="Try all three">
      <Win title="Vibe presets" right={<span className="chip sm on">{usd(D.total)}</span>}>
        <div className="row" style={{ marginBottom: 10 }}>{Object.entries(PRE).map(([k, v]) => <button key={k} className={cx("btn sm", p === k && "pri")} onClick={() => setP(k)}>{v.n}</button>)}</div>
        <div className="g2e" style={{ gap: 12 }}>
          <Room3D s={p} t={0.35} />
          <div><Iso fills={fills} /><div className="tbl">{["Floor", "Walls", "Fixtures", "Lighting"].map((a, i) => <div className="trow two" key={a}><span>{a}</span><b>{D.sku[i]}</b></div>)}<div className="trow two"><span>Labor</span><b><Count to={D.h} suffix=" h" /></b></div></div></div>
        </div>
      </Win>
    </Feat>
  );
}

function Render() {
  const [s, setS] = useState("luxury"), [ph, setPh] = useState(0), [p, setP] = useState(0), [pos, setPos] = useState(null);
  const iv = useRef(null);
  useEffect(() => () => clearInterval(iv.current), []);
  const wipe = useTween(ph === 2 ? 45 : 100, 1400, 100);
  const cur = pos === null ? wipe : pos;
  const start = () => { clearInterval(iv.current); setPh(1); setP(0); setPos(null); const t0 = Date.now(); iv.current = setInterval(() => { const v = Math.min(1, (Date.now() - t0) / 4000); setP(v); if (v >= 1) { clearInterval(iv.current); setPh(2); } }, 60); };
  return (
    <Feat tag="magazine quality" title="From 3D view to real photo" pts={["One click from any camera angle", "AI keeps walls and windows exact", "About 4 seconds per render", "Renders drop into the bank report"]} note="Pick a style, then snap">
      <Win title="Photorealistic render" right={ph === 2 ? <span className="chip sm on">Done</span> : null}>
        <div className="row" style={{ marginBottom: 8 }}>{["luxury", "scandi", "loft"].map(k => <button key={k} className={cx("btn sm", s === k && "pri")} onClick={() => { setS(k); setPh(0); setPos(null); }}>{STY[k].n}</button>)}</div>
        <div style={{ position: "relative", border: "1.5px solid var(--ink)", overflow: "hidden" }}>
          <div style={{ opacity: ph === 2 ? 1 : 0 }}><Room3D s={s} t={0.4} /></div>
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - cur}% 0 0)`, background: "#fff" }}><Room3D s={s} t={0.4} wire /></div>
          {ph === 1 && <div className="scanl" style={{ animationDuration: "1.6s" }} />}
          {ph === 2 && <div style={{ position: "absolute", top: 0, bottom: 0, left: cur + "%", width: 3, background: "var(--org)" }} />}
          <span className="chip sm" style={{ position: "absolute", left: 8, top: 8 }}>3D depth map</span>
          {ph === 2 && <span className="chip sm on" style={{ position: "absolute", right: 8, top: 8 }}>AI render</span>}
        </div>
        {ph === 2 && <input className="noswipe" type="range" min="0" max="100" value={cur} onChange={e => setPos(+e.target.value)} style={{ width: "100%", marginTop: 8 }} aria-label="Compare 3D and render" />}
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn pri" onClick={start} disabled={ph === 1}>{ph === 1 ? `Generating ${Math.ceil(4 - p * 4)}s` : "Snap photorealistic render"}</button>
          {ph === 1 && <div style={{ flex: 1 }}><div className="trk"><div style={{ width: p * 100 + "%", background: "var(--org)" }} /></div></div>}
        </div>
      </Win>
    </Feat>
  );
}

function Snap() {
  const [ph, setPh] = useState(0);
  const go = () => { setPh(1); setTimeout(() => setPh(2), 1700); };
  useEffect(() => { const t = setTimeout(go, 900); return () => clearTimeout(t); }, []);
  const D = [["Herringbone oak parquet", "Oak parquet 90 mm", "+15% cut waste"], ["Matte black fixtures", "Black matte tapware", "No extra"], ["Subway wall tile", "White subway 75 × 150", "+10% cut waste"]];
  const fills = ph === 2 ? { living: FLOOR.herring, kitchen: FLOOR.herring } : {};
  const box = (l, t, w, h, d) => <div className="dbox pop" style={{ left: l + "%", top: t + "%", width: w + "%", height: h + "%", animationDelay: d + "s" }} />;
  return (
    <Feat tag="love it? copy it" title="Upload a photo. Get the materials." pts={["Pinterest or Instagram photo in", "AI names every material it sees", "Matches them to real products", "Waste adjusts: herringbone needs more"]} note="Pattern changes the waste">
      <Win title="Snap-to-Match" right={<button className="btn sm" onClick={go}>Analyze photo</button>}>
        <div className="g2e" style={{ gap: 14, alignItems: "start" }}>
          <div className="polaroid"><div className="tape" /><div style={{ position: "relative" }}><Room3D s="scandi" t={0.45} />{ph === 1 && <div className="scanl" />}{ph === 2 && <>{box(8, 68, 84, 28, 0)}{box(62, 12, 16, 26, 0.4)}{box(72, 16, 11, 46, 0.8)}</>}</div></div>
          <div>
            {ph === 2 ? D.map(([a, b, c], i) => <div className="trow pop" key={a} style={{ gridTemplateColumns: "1fr", animationDelay: i * 0.4 + "s" }}><b>{a}</b><small>Matched: {b}</small><span className={cx("chip sm", i !== 1 && "on")}>{c}</span></div>) : <div className="hand" style={{ fontSize: 26 }}>{ph === 1 ? "Reading the photo…" : "Press Analyze"}</div>}
            <div style={{ marginTop: 10 }}><Iso fills={fills} /></div>
          </div>
        </div>
      </Win>
    </Feat>
  );
}

function Wall() {
  const [on, setOn] = useState(false), [lb, setLb] = useState(true);
  const o = useTween(on ? 1 : 0, 1200, 0);
  const d = [["Bricks", -420, " pcs"], ["Plaster", -38, " m²"], ["Demolition labor", 14, " h"], ["Steel I-beam", lb ? 1 : 0, ""]];
  const net = -420 * 0.6 - 38 * 9 + 14 * 40 + (lb ? 1800 : 0);
  return (
    <Feat tag="what if" title="Knock down a wall. See the bill." pts={["Click a wall, remove it", "3D opens up instantly", "Bricks and plaster drop out", "Demolition hours get added", "Load-bearing? A steel beam appears"]} note="Open concept is not free">
      <Win title="Smart layout" right={<button className="btn sm pri" onClick={() => setOn(v => !v)}>{on ? "Put wall back" : "Remove wall"}</button>}>
        <div className="g2e" style={{ gap: 10 }}><Plan open={o} dims /><Iso open={o} intH={30} /></div>
        <div className="row" style={{ margin: "8px 0" }}><Switch on={lb} set={setLb} label="Load-bearing wall" /><span>Vision AI flagged it load-bearing</span></div>
        <div className="tbl">{d.map(([a, v, u]) => <div className="trow two" key={a}><span>{a}</span><b>{on ? (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Math.round(v * o)) + u : "0"}{a === "Steel I-beam" && !lb && on ? " (not needed)" : ""}</b></div>)}<div className="trow two th"><span>Net cost change</span><b style={{ color: net > 0 ? "var(--red)" : "var(--ok)" }}>{on ? (net > 0 ? "+" : "−") + usd(Math.abs(net)) : "$0"}</b></div></div>
      </Win>
    </Feat>
  );
}

function Sun() {
  const [t, setT] = useState(0.4), [sky, setSky] = useState(false), [led, setLed] = useState("warm");
  const hr = 6 + t * 16, hh = Math.floor(hr), mm = Math.round((hr - hh) * 60);
  const label = `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`;
  const dark = hr > 18.5 && !sky;
  return (
    <Feat tag="feel the room" title="Scrub the sun. Fix the light." pts={["Slide from 6 AM to 10 PM", "See how sunlight enters", "Warm or cool LED lighting", "Too dark? Add a window or skylight"]} note="Drag the slider">
      <Win title={`Sun and light, ${label}`} right={<span className={cx("chip sm", dark && "on")}>{dark ? "Too dark" : "Looks good"}</span>}>
        <Room3D s="scandi" t={t} skylight={sky} led={led} />
        <input className="noswipe" type="range" min="0" max="1" step="0.01" value={t} onChange={e => setT(+e.target.value)} style={{ width: "100%", margin: "8px 0" }} aria-label="Time of day" />
        <div className="row"><button className={cx("btn sm", led === "warm" && "pri")} onClick={() => setLed("warm")}>Warm LED</button><button className={cx("btn sm", led === "cool" && "pri")} onClick={() => setLed("cool")}>Cool LED</button><button className={cx("btn sm", sky && "pri")} onClick={() => setSky(s => !s)}>{sky ? "Skylight added" : "Add skylight"}</button></div>
        {sky && <div className="tbl pop" style={{ marginTop: 8 }}>{[["Glass", "+1.2 m²"], ["Framing", "+4 m"], ["Masonry lintel", "+1"]].map(([a, b]) => <div className="trow two" key={a}><span>{a}</span><b>{b}</b></div>)}</div>}
      </Win>
    </Feat>
  );
}

const BL = [
  { n: "Flooring", o: [["Italian marble", 6800], ["Porcelain tile", 3900], ["Vinyl plank", 2100]] },
  { n: "Countertops", o: [["Quartz", 3200], ["Laminate", 1200]] },
  { n: "Cabinets", o: [["Solid wood", 4800], ["MDF", 2600]] },
  { n: "Fixtures", o: [["Brushed brass", 2400], ["Chrome", 1100]] },
  { n: "Lighting", o: [["Designer", 1900], ["Basic LED", 800]] },
  { n: "Brick, cement, steel", lock: 1, o: [["Structural", 5400]] },
];
const BMAX = BL.reduce((a, x) => a + x.o[0][1], 0), BMIN = BL.reduce((a, x) => a + x.o[x.o.length - 1][1], 0);
function Budget() {
  const [b, setB] = useState(17000);
  const lv = useMemo(() => {
    const l = BL.map(() => 0); const tot = () => BL.reduce((a, x, i) => a + x.o[l[i]][1], 0);
    while (tot() > b) { let bi = -1, bs = 0; BL.forEach((x, i) => { if (x.lock || l[i] >= x.o.length - 1) return; const s = x.o[l[i]][1] - x.o[l[i] + 1][1]; if (s > bs) { bs = s; bi = i; } }); if (bi < 0) break; l[bi]++; }
    return l;
  }, [b]);
  const total = BL.reduce((a, x, i) => a + x.o[lv[i]][1], 0);
  return (
    <Feat tag="the money saver" title="Set a budget. AI makes it fit." pts={["Type a maximum budget", "AI swaps pricey materials for cheaper ones", "Structure is never touched", "Total lands under your limit"]} note="Drag the budget down">
      <Win title="Budget-Lock" right={<span className={cx("chip sm", total <= b && "on")}>{total <= b ? "Fits" : "Too low"}</span>}>
        <div className="row"><b>Max budget</b><b className="disp" style={{ fontSize: 28 }}>{usd(b)}</b></div>
        <input className="noswipe" type="range" min={BMIN} max={BMAX} step="100" value={b} onChange={e => setB(+e.target.value)} style={{ width: "100%" }} aria-label="Maximum budget" />
        <div className="tbl" style={{ marginTop: 8 }}>{BL.map((x, i) => <div key={x.n} className={cx("trow", lv[i] > 0 && "on")} style={{ gridTemplateColumns: "1.3fr 1.3fr .8fr" }}><span>{x.lock ? "🔒 " : ""}{x.n}</span><b>{x.o[lv[i]][0]}{lv[i] > 0 ? " ↓" : ""}</b><span>{usd(x.o[lv[i]][1])}</span></div>)}</div>
        <div style={{ position: "relative", marginTop: 12 }}><div className="trk big"><div style={{ width: (total / BMAX) * 100 + "%", background: total <= b ? "var(--ok)" : "var(--red)", transition: "width .4s" }} /></div><div style={{ position: "absolute", top: -4, bottom: -4, left: (b / BMAX) * 100 + "%", width: 3, background: "var(--org)" }} /></div>
        <div className="row" style={{ marginTop: 6 }}><b>Total {usd(total)}</b></div>
      </Win>
    </Feat>
  );
}

function Compare() {
  const [alt, setAlt] = useState("tile");
  const A = { n: "Italian marble", cost: 11400, qty: 66, days: 9 };
  const B = { tile: { n: "Porcelain tile", cost: 4900, qty: 63, days: 5 }, vinyl: { n: "Vinyl plank", cost: 2700, qty: 62, days: 3 } }[alt];
  const R = [["Material cost", A.cost, B.cost, usd], ["Material needed (m²)", A.qty, B.qty, v => v], ["Labor time (days)", A.days, B.days, v => v]];
  return (
    <Feat tag="decide with proof" title="Two designs. One screen." pts={["Clone any project in one click", "Change one side only", "See the exact gap in materials", "See the exact gap in labor time"]} note="Switch side B">
      <Win title="Side-by-side compare" right={<span className="chip sm on">Save {usd(A.cost - B.cost)}, {A.days - B.days} days</span>}>
        <div className="row" style={{ marginBottom: 10 }}><b>Compare marble with</b><button className={cx("btn sm", alt === "tile" && "pri")} onClick={() => setAlt("tile")}>Tile</button><button className={cx("btn sm", alt === "vinyl" && "pri")} onClick={() => setAlt("vinyl")}>Vinyl</button></div>
        <div className="g2e" style={{ gap: 18 }}>
          {[["A", A, "#C4452D"], ["B", B, "#2E7DD1"]].map(([k, X, c]) => (
            <div key={k}><h3 className="disp" style={{ fontSize: 22, margin: "0 0 8px" }}>{k}: {X.n}</h3>
              {R.map(([lab, a, b2, f], i) => { const v = k === "A" ? a : b2; return <div key={lab} style={{ marginBottom: 12 }}><small>{lab}</small><div className="disp" style={{ fontSize: 24 }}>{f(v)}</div><Bar p={(v / Math.max(a, b2)) * 100} c={c} /></div>; })}
            </div>
          ))}
        </div>
      </Win>
    </Feat>
  );
}

function Heat() {
  const [on, setOn] = useState(true), [h, setH] = useState(null);
  const mx = Math.max(...ROOMS.map(r => r.cost));
  const col = r => mix("#9CC4F0", "#E8402A", Math.pow(r.cost / mx, 1.2));
  const fills = on ? Object.fromEntries(ROOMS.map(r => [r.id, col(r)])) : {};
  const sub = on ? Object.fromEntries(ROOMS.map(r => [r.id, Math.round((r.cost / TOTAL) * 100) + "%"])) : {};
  const rk = [...ROOMS].sort((a, b) => b.cost - a.cost);
  return (
    <Feat tag="follow the money" title="See where the budget goes" pts={["Red: heavy-material rooms", "Blue: simple rooms", "Share of total on every room"]} note="Kitchen is the hot spot">
      <Win title="Money heatmap" right={<span className="row"><span>Heatmap</span><Switch on={on} set={setOn} label="Heatmap" /></span>}>
        <div className="g2e" style={{ gap: 12 }}>
          <Plan fills={fills} sub={sub} hl={h} />
          <div>{rk.map(r => <div key={r.id} onMouseEnter={() => setH(r.id)} onMouseLeave={() => setH(null)} style={{ marginBottom: 8 }}><div className="row" style={{ justifyContent: "space-between" }}><b>{r.name}</b><span>{usd(r.cost)}</span></div><Bar p={(r.cost / mx) * 100} c={col(r)} /></div>)}
            <div className="legend" /><div className="row" style={{ justifyContent: "space-between" }}><small>Light spend</small><small>Heavy spend</small></div></div>
        </div>
      </Win>
    </Feat>
  );
}

const TASKS = [["Painting", 40], ["Demolition", 36], ["Flooring", 72], ["Tiling", 56], ["Plumbing", 60], ["Electrical", 48]];
function DIY() {
  const [d, setD] = useState({});
  const hrs = TASKS.reduce((a, [n, h]) => a + (d[n] ? 0 : h), 0), all = 312;
  const days = Math.ceil(hrs / 16);
  return (
    <Feat tag="do it yourself" title="Flip a task. Keep the money." pts={["Hire a Pro or I'll Do It", "Worker hours drop to zero", "Timeline shortens too", "Savings show instantly"]} note="Flip painting first">
      <Win title="DIY switch" right={<span className="chip sm on">You save {usd((all - hrs) * 42)}</span>}>
        <div className="tbl">{TASKS.map(([n, h]) => <div key={n} className={cx("trow", d[n] && "on")} style={{ gridTemplateColumns: "1.2fr .8fr 1fr" }}><b>{n}</b><span>{d[n] ? "0 h" : h + " h"}</span><span className="row"><Switch on={!!d[n]} set={v => setD(o => ({ ...o, [n]: v }))} label={"Do " + n + " myself"} /><small>{d[n] ? "I'll do it" : "Hire a pro"}</small></span></div>)}</div>
        <div className="g3" style={{ marginTop: 12, gap: 10 }}>
          <div className="stat"><small>Worker hours</small><div className="disp">{hrs}</div></div>
          <div className="stat"><small>Labor cost</small><div className="disp">{usd(hrs * 42)}</div></div>
          <div className="stat"><small>Timeline</small><div className="disp">{days} days</div></div>
        </div>
      </Win>
    </Feat>
  );
}

function Country() {
  const [u, setU] = useState("m");
  const N = [["Plasterboard", "Drywall"], ["Cement bag 50 kg", "Cement bag 94 lb"], ["Timber", "Lumber"], ["Skirting board", "Baseboard"], ["Tap", "Faucet"]];
  const A = u === "m" ? "88.9 m²" : "957 ft²";
  return (
    <Feat tag="one click, any country" title="Feet or meters. Same project." pts={["Flips every measurement", "Translates material names", "One global toggle"]} note="Flip it">
      <Win title="Localization" right={<span className="row"><button className={cx("btn sm", u === "m" && "pri")} onClick={() => setU("m")}>Metric</button><button className={cx("btn sm", u === "ft" && "pri")} onClick={() => setU("ft")}>Imperial</button></span>}>
        <div className="g2e" style={{ gap: 12 }}>
          <div><Plan dims unit={u === "m" ? "m" : "ft"} /><div className="disp" style={{ fontSize: 30, marginTop: 6 }}>{A}</div></div>
          <div className="tbl">{N.map(([a, b]) => <div className="trow two" key={a + u}><span className="pop">{u === "m" ? a : b}</span><small>{u === "m" ? b : a}</small></div>)}</div>
        </div>
      </Win>
    </Feat>
  );
}

const Pg = ({ children, style }) => <div className="pg" style={style}>{children}</div>;
function Docs1() {
  const [o, setO] = useState(false);
  useEffect(() => { const t = setTimeout(() => setO(true), 400); return () => clearTimeout(t); }, []);
  const lines = n => [...Array(n)].map((_, i) => <div key={i} className="ln" style={{ width: 55 + ((i * 37) % 45) + "%" }} />);
  return (
    <Feat tag="what they download" title="Reports that get loans approved" pts={["15-page bank loan book", "Profit projections, 3D views, timelines", "Material counts and risk buffers", "Branded client quote with your logo"]} note="Both exported as PDF">
      <div style={{ display: "flex", gap: 34, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ position: "relative", width: 330, height: 280 }}>
          {[0, 1, 2].map(i => (
            <Pg key={i} style={{ position: "absolute", left: 0, top: 0, zIndex: 3 - i, transform: o ? `translateX(${i * 66}px) rotate(${(i - 1) * 4}deg)` : "none", transition: "transform .9s cubic-bezier(.2,.8,.2,1)" }}>
              {i === 0 && <><b className="disp" style={{ fontSize: 17 }}>Investment report</b><Iso furn={false} /><div className="ln" style={{ width: "70%" }} /><small>15 pages</small></>}
              {i === 1 && <><b>Profit projection</b><svg viewBox="0 0 160 110" style={{ width: "100%" }}>{[20, 36, 52, 70, 92].map((h, k) => <rect key={k} x={8 + k * 30} y={104 - h} width="20" height={h} fill="#2F9E6B" />)}</svg>{lines(4)}</>}
              {i === 2 && <><b>Timeline + materials</b>{lines(12)}</>}
            </Pg>
          ))}
        </div>
        <Pg style={{ width: 200, height: 270 }}>
          <div className="row" style={{ justifyContent: "space-between" }}><div className="logo">Your logo</div><small>Quote 0142</small></div>
          <b className="disp" style={{ fontSize: 15, display: "block", margin: "10px 0 6px" }}>Renovation quote</b>
          {["Flooring", "Walls + paint", "Kitchen", "Labor"].map((a, i) => <div className="trow two" key={a} style={{ fontSize: 10 }}><span>{a}</span><b>{usd([6800, 3100, 7400, 13100][i])}</b></div>)}
          <div className="disp" style={{ fontSize: 22, marginTop: 10 }}>{usd(30400)}</div><div className="ln" style={{ width: "40%", marginTop: 14 }} /><small>Signature</small>
        </Pg>
      </div>
    </Feat>
  );
}

function Docs2() {
  const T = [["Demolition", 0, 3, "#C4452D"], ["Masonry", 3, 6, "#FF5B1F"], ["Plumbing + electrical", 8, 5, "#2E7DD1"], ["Flooring", 12, 5, "#2F9E6B"], ["Painting", 16, 3, "#7A4FD6"], ["Fixtures", 19, 2, "#C99A00"]];
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 250); return () => clearTimeout(t); }, []);
  const mail = useTyped("To: Metro Hardware\nSubject: Quote request, 3-bed renovation\n\nHi, please quote the attached list:\n- Porcelain tile, 63 m²\n- Cement, 86 bags\n- Bricks, 12,480\nDelivery within 14 days. Thanks!", 16);
  return (
    <Feat tag="after the estimate" title="A schedule and the emails, ready" pts={["Day-by-day work calendar", "Built from the worker hours", "Supplier emails drafted for you", "Exact material list attached"]} note="Send in one click">
      <Win title="Daily work calendar">
        {T.map(([n, s, l, c], i) => <div key={n} className="gr"><small>{n}</small><div className="gt"><div style={{ position: "absolute", left: (s / 21) * 100 + "%", width: go ? (l / 21) * 100 + "%" : 0, height: "100%", background: c, transition: `width .7s ${i * 0.25}s ease` }} /></div></div>)}
        <div className="gr"><small /><div className="row" style={{ justifyContent: "space-between" }}>{[1, 5, 10, 15, 21].map(d => <small key={d}>Day {d}</small>)}</div></div>
      </Win>
      <Win title="Supplier email" style={{ marginTop: 16 }} right={<span className="chip sm">materials.pdf</span>}><pre className="mail">{mail}<span className="caret" /></pre></Win>
    </Feat>
  );
}

/* ───────────── workflow ───────────── */
const AN = [
  ["Browser", "Next.js, Tailwind, R3F", "User opens the dashboard."], ["Login + billing", "Clerk, Stripe $99", "Clerk logs in. Stripe adds 50 credits."], ["Upload", "PDF straight to S3", "The plan goes directly to S3."], ["API gateway", "FastAPI in Docker", "FastAPI checks credits, returns a job id."],
  ["Job queue", "Redis, Celery", "Heavy work runs in the background."], ["LangGraph agents", "5 nodes, one state", "Agents read the plan and do the math."], ["Database", "PostgreSQL, Master JSON", "Everything saves as one JSON state."], ["Live push", "WebSockets", "Updates stream to the screen."],
  ["Workspace", "2D, 3D, sheet, chat", "User edits. JSON updates. Repeat."], ["Exports", "Jinja2, WeasyPrint", "PDFs and emails come from the same JSON."],
];
const POS = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2]];
const nx = i => 20 + POS[i][0] * 240, ny = i => 20 + POS[i][1] * 140;
function Arch() {
  const [k] = useTick(1700, AN.length);
  const path = AN.map((_, i) => `${nx(i) + 110},${ny(i) + 44}`).join(" ");
  return (
    <>
      <Head tag="the whole system">Follow one floor plan through it</Head>
      <svg viewBox="0 0 980 410" style={{ width: "100%" }}>
        <polyline points={path} fill="none" stroke="#7FB0F0" strokeWidth="3" strokeDasharray="8 8" className="march" />
        {AN.map(([a, b], i) => (
          <g key={a}>
            <rect x={nx(i)} y={ny(i)} width="220" height="88" rx="10" style={{ fill: i === k ? "#FF5B1F" : i < k ? "#1D4A86" : "#143B70", stroke: i === k ? "#FFD2BF" : "#7FB0F0", strokeWidth: 2, transition: "fill .4s" }} />
            <text x={nx(i) + 110} y={ny(i) + 38} textAnchor="middle" fill="#fff" fontWeight="700" fontSize="19">{a}</text>
            <text x={nx(i) + 110} y={ny(i) + 62} textAnchor="middle" fill="#CFE3FF" fontSize="13">{b}</text>
          </g>
        ))}
        <g style={{ transform: `translate(${nx(k) + 110}px,${ny(k) + 44}px)`, transition: "transform 1.1s ease" }}><circle r="12" fill="#F5C542" /><circle r="22" fill="none" stroke="#F5C542" strokeWidth="2" opacity=".6" /></g>
      </svg>
      <div className="hand" style={{ fontSize: 30 }}>{AN[k][2]}</div>
    </>
  );
}

function FlowViz({ items }) {
  const [k] = useTick(1500, items.length);
  return <Win title="Pipeline"><div className="flowv">{items.map((it, j) => <div key={it[0]} className={cx("fv", j === k && "on", j < k && "done")}><span className="fvn">{j + 1}</span><div><b>{it[0]}</b><small>{it[1]}</small></div></div>)}</div></Win>;
}
const P1 = () => <Feat tag="phase 1" title="Access, auth and credit guardrail" pts={["Clerk attaches a secure user id to every request", "Stripe invoice.paid webhook adds 50 credits", "FastAPI checks credits before every upload", "No credits, no AI bill"]}><FlowViz items={[["Clerk login", "user_id on every request"], ["Stripe webhook", "invoice.paid fires after $99"], ["+50 credits", "saved to the PostgreSQL profile"], ["Credit lock", "zero credits means upload blocked"]]} /></Feat>;
const P2 = () => <Feat tag="phase 2" title="Ingestion and background queue" pts={["Browser uploads straight to S3", "Pillow scales pages to 1024 × 1024", "Cuts LLM token cost, keeps text clear", "Job id returns at once, screen never freezes"]}><FlowViz items={[["Pre-signed URL", "browser to S3, API stays light"], ["Image normalization", "pages resized to 1024 × 1024"], ["Redis + Celery", "S3 link queued as a job"], ["job_id returned", "user sees progress, not a freeze"]]} /></Feat>;
const P3 = () => <Feat tag="phase 3" title="The three-agent pipeline" pts={["Triage drops cover sheets", "Vision reads rooms into strict JSON", "Plain Python does the math", "XGBoost adds the cut buffer", "A human-in-the-loop pause shows the draft"]} note="You already know this one"><FlowViz items={[["Triage", "GPT-4o-mini, pennies per page"], ["Vision", "Claude 3.5 Sonnet, rooms + [x, y]"], ["Math", "bricks, cement, tiles, hours"], ["Waste", "XGBoost, +5% to +15%"], ["Pause", "interrupt() saves state, draft to screen"]]} /></Feat>;
const P5 = () => <Feat tag="phase 5" title="Documents and bids, automatic" pts={["Same JSON feeds every document", "Jinja2 fills styled templates", "WeasyPrint prints PDFs in under 2 seconds", "Gantt chart built from worker hours"]}><FlowViz items={[["Pull the JSON", "state, render URLs, Gantt data"], ["Jinja2 template", "styled HTML and CSS"], ["WeasyPrint", "print-ready PDF in under 2 s"], ["Saved to S3", "download link for the user"]]} /></Feat>;

const TL = [
  ["Click-to-Verify", "Canvas", "b"], ["Money Heatmap", "Canvas", "b"], ["Live 3D home", "Three.js", "b"], ["Chat-to-Change", "GPT-4o-mini + API", "l"],
  ["Budget-Lock", "Python solver", "p"], ["Side-by-Side", "PostgreSQL versions", "d"], ["DIY switch", "Python", "p"], ["1-Click localization", "Python", "p"],
  ["Style presets", "Python + Three.js", "p"], ["Photoreal render", "Replicate API", "l"], ["Snap-to-Match", "Claude Vision", "l"], ["Wall knockdown", "Python + Three.js", "p"], ["Sun + lighting", "Three.js", "b"],
];
const TC = { b: "#2E7DD1", l: "#7A4FD6", p: "#FF5B1F", d: "#2F9E6B" };
function P4() {
  return (
    <>
      <Head tag="phase 4">Every tool, and where it lives</Head>
      <div className="row">{[["b", "Browser"], ["p", "Python"], ["l", "AI model"], ["d", "Database"]].map(([k, n]) => <span key={k} className="chip sm" style={{ borderColor: TC[k] }}><i className="dot" style={{ background: TC[k] }} />{n}</span>)}</div>
      <div className="g4">{TL.map(([a, b, k]) => <div key={a} className="tile" style={{ borderLeftColor: TC[k] }}><b>{a}</b><small>{b}</small></div>)}</div>
      <div className="hand" style={{ fontSize: 26 }}>Most of it is plain code. AI is used only where it truly helps.</div>
    </>
  );
}

/* ───────────── how we build the new features ───────────── */
const JL = [["{", null], ['  "project_id": "123",', "id"], ['  "units": "metric",', "units"], ['  "version": "version_a",', "version"], ['  "rooms": [{ "name": "Kitchen", "area_sqm": 25, "walls": 4 }],', "rooms"], ['  "materials": [{ "item": "Ceramic Tile", "qty": 300, "cost": 4500 }],', "materials"], ['  "labor_hours": 48,', "labor"], ['  "renders": ["url_1", "url_2"]', "renders"], ["}", null]];
const JT = [
  ["Chat-to-Change", { materials: "w", labor: "w" }], ["Budget-Lock", { materials: "w" }], ["Side-by-Side", { version: "w", materials: "r" }], ["Heatmap", { rooms: "r", materials: "r" }],
  ["2D to 3D", { rooms: "r" }], ["Country switch", { units: "w", rooms: "w" }], ["Photoreal render", { renders: "w", materials: "r" }], ["Wall knockdown", { rooms: "w", materials: "w", labor: "w" }],
  ["DIY switch", { labor: "w" }], ["PDF exports", { rooms: "r", materials: "r", labor: "r", renders: "r", units: "r" }],
];
function JsonSlide() {
  const [k, setK] = useState(0), [auto, setAuto] = useState(true);
  useEffect(() => { if (!auto) return; const t = setInterval(() => setK(x => (x + 1) % JT.length), 2200); return () => clearInterval(t); }, [auto]);
  const m = JT[k][1];
  return (
    <>
      <Head tag="the big trick">One JSON. Every feature plugs into it.</Head>
      <div className="g2e" style={{ alignItems: "start" }}>
        <div className="code big">{JL.map(([t, key], i) => <div key={i} className={cx("cl", key && m[key] === "w" && "w", key && m[key] === "r" && "r")}>{t}{key && m[key] && <em>{m[key] === "w" ? "edits" : "reads"}</em>}</div>)}</div>
        <div>
          <div className="row" style={{ gap: 8 }}>{JT.map(([n], i) => <button key={n} className={cx("btn sm", i === k && "pri")} onClick={() => { setK(i); setAuto(false); }}>{n}</button>)}</div>
          <ul className="bl" style={{ marginTop: 20 }}><li>AI reads the plan once</li><li>Result lives in PostgreSQL</li><li>Each tool only reads or edits this file</li><li>No extra agents. No vector database.</li></ul>
        </div>
      </div>
    </>
  );
}

function Impl({ tag, title, items }) {
  const [k, setK] = useState(0), [s, setS] = useState(0);
  useEffect(() => { setS(0); const t = setInterval(() => setS(x => (x + 1) % items[k].st.length), 1200); return () => clearInterval(t); }, [k, items]);
  const it = items[k];
  return (
    <>
      <Head tag={tag}>{title}</Head>
      <div className="g2e" style={{ alignItems: "start" }}>
        <div className="tabs">{items.map((x, i) => <button key={x.n} className={cx("tab", i === k && "on")} onClick={() => setK(i)}><b>{x.n}</b><small>Runs in: {x.w}</small></button>)}</div>
        <Win title={it.n} right={<span className="chip sm on">{it.w}</span>}>
          <div className="flowv">{it.st.map((t, j) => <div key={t} className={cx("fv", j === s && "on", j < s && "done")}><span className="fvn">{j + 1}</span><div><b>{t}</b></div></div>)}</div>
          <pre className="code">{it.code}</pre>
        </Win>
      </div>
    </>
  );
}
const COST = [
  { n: "Chat-to-Change", w: "LLM + Python", st: ["User message + Master JSON", "GPT-4o-mini returns a JSON patch", "Python re-runs the math", "WebSocket pushes new state", "3D texture swaps live"], code: "patch = llm(msg, state)   # patch only\nstate = apply(state, patch)\nstate = recalc(state)     # plain Python\nws.send(state)" },
  { n: "Budget-Lock", w: "Python", st: ["User sets a max budget", "Rank non-structural items by saving", "Swap to the next cheaper SKU", "Loop until total fits", "Return the updated JSON"], code: "while total(state) > budget:\n    item = biggest_saving(state, structural=False)\n    item.sku = next_cheaper(item.sku)" },
  { n: "Side-by-Side", w: "Database", st: ["Clone the project row", "Save as version_a and version_b", "Edit one side only", "Diff totals and labor days"], code: "b = clone(project, version=\"version_b\")\ndiff = compare(project.a, b)" },
  { n: "Money Heatmap", w: "Browser", st: ["Read room costs from JSON", "Compute each room's share", "Map share to blue-to-red", "Paint the 2D canvas"], code: "share = room.cost / total\ncolor = lerp(BLUE, RED, share / max_share)" },
  { n: "DIY switch", w: "Python", st: ["User flips a task", "Zero that task's labor hours", "Recalculate cost and timeline", "Gantt chart redraws"], code: "task.hours = 0 if diy else task.base_hours\nstate.timeline = schedule(state.tasks)" },
  { n: "Country switch", w: "Python", st: ["Toggle units", "Multiply dimensions (10.764 for area)", "Swap material names from a dictionary", "UI refreshes at once"], code: "area_sqft = area_sqm * 10.764\nname = NAMES[\"Plasterboard\"]  # Drywall" },
  { n: "Vibe presets", w: "Python + Browser", st: ["Click a preset", "Swap SKUs in the JSON", "Recalculate quantities and labor", "Swap 3D textures and lighting"], code: "state.materials = PRESETS[\"dubai\"]\nstate = recalc(state)" },
];
const VIZ = [
  { n: "2D to 3D", w: "Browser", st: ["Read wall [x, y] from the JSON", "Extrude walls to height", "Apply PBR textures", "Orbit in WebGL on the user GPU"], code: "<Extrude args={[shape, { depth: 2.7 }]} />\n// zero server load" },
  { n: "Photoreal render", w: "Replicate API", st: ["Capture the camera angle", "Make a depth map / Canny edges", "Flux.1 + ControlNet, style prompt", "Walls and windows stay locked", "Save URL to renders[] in JSON"], code: "img = replicate.run(\"flux-1-controlnet-depth\",\n  image=depth_map, prompt=style)\nstate[\"renders\"].append(img.url)" },
  { n: "Snap-to-Match", w: "Claude Vision", st: ["Upload an inspiration photo", "Claude Vision lists the materials", "Map each to the product database", "Update 3D textures", "Apply the pattern waste multiplier"], code: "found = vision(photo)   # herringbone oak...\nsku = match(found, catalog)\nwaste = PATTERN_WASTE[\"herringbone\"]  # +15%" },
  { n: "Wall knockdown", w: "Python + Browser", st: ["Click wall, Remove", "3D wall disappears", "Deduct bricks and plaster", "Add demolition hours", "Load-bearing? Add steel I-beam"], code: "state.deduct(wall.bricks, wall.plaster)\nstate.labor += DEMOLITION_HOURS\nif wall.load_bearing: state.add(\"I-beam\")" },
  { n: "Sun and light", w: "Browser", st: ["Time slider, 6 AM to 10 PM", "Move the sun light in the scene", "Toggle warm or cool LED", "Add skylight: glass, framing, lintel"], code: "sun.position = arc(hour)\nif add_skylight: state.add(glass, frame, lintel)" },
  { n: "Click-to-Verify", w: "Browser", st: ["Click a table row", "Read [x, y] from the JSON", "Draw a neon box on the canvas"], code: "ctx.strokeRect(room.x, room.y, room.w, room.h)" },
];

function Credits() {
  const [c, setC] = useState(50), [r, setR] = useState(0), [msg, setMsg] = useState("");
  const use = renders => { if (c <= 0) { setMsg("Upload blocked: zero credits."); return; } setC(c - 1); setMsg(""); if (renders) setR(x => x + 5); };
  return (
    <Feat tag="protect the margin" title="Credits keep AI costs in check" pts={["$99 plan includes 50 credits", "1 credit = 1 estimate", "1 credit = a batch of 5 renders", "About $0.015 per HD render", "Target margin above 85%"]} note="Spend credits">
      <Win title="Credit meter" right={<b>{c} left</b>}>
        <div className="dots">{[...Array(50)].map((_, i) => <i key={i} className={i < c ? "on" : ""} />)}</div>
        <div className="row" style={{ margin: "12px 0" }}><button className="btn sm" onClick={() => use(false)}>Run an estimate</button><button className="btn sm" onClick={() => use(true)}>Generate 5 renders</button><button className="btn sm" onClick={() => { setC(50); setR(0); setMsg(""); }}>Reset</button></div>
        <div className="g3" style={{ gap: 10 }}><div className="stat"><small>Renders made</small><div className="disp">{r}</div></div><div className="stat"><small>Render API spend</small><div className="disp">${(r * 0.015).toFixed(2)}</div></div><div className="stat"><small>Credits used</small><div className="disp">{50 - c}</div></div></div>
        {msg && <div className="callout" style={{ background: "var(--red)", color: "#fff" }}>{msg} FastAPI stops the job before any AI cost.</div>}
      </Win>
    </Feat>
  );
}

const TS = [
  ["Frontend", "Next.js + Tailwind", "Server rendering, global CDN", "b"], ["2D + 3D", "Canvas + React-Three-Fiber", "Runs on the user GPU, zero server load", "b"], ["Creative AI", "Flux.1 + ControlNet", "Via Replicate or Fal.ai, geometry locked", "l"], ["Textures", "PolyHaven + AmbientCG", "Free 4K wood, marble, concrete, brick", "b"],
  ["Auth + billing", "Clerk + Stripe", "Enterprise security, webhook sync", "p"], ["API", "FastAPI + WebSockets", "Async Python, thousands of connections", "p"], ["Queue", "Celery + Redis", "45-second AI jobs run in the background", "p"], ["AI + ML", "LangGraph, Claude 3.5, XGBoost", "AI vision kept apart from exact math", "l"],
  ["Data", "PostgreSQL + AWS S3", "Row-Level Security, S3 scales endlessly", "d"], ["Exports", "Jinja2 + WeasyPrint", "HTML to PDF in under 2 seconds", "p"], ["Cloud", "Docker on DigitalOcean / AWS ECS", "Extra worker containers when traffic surges", "d"], ["Monitoring", "LangSmith + Sentry", "Catch LLM failures and errors fast", "d"],
];
function Stack() {
  const [h, setH] = useState(null);
  return (
    <>
      <Head tag="the tech stack">What we build it with</Head>
      <div className="row">{[["b", "Browser"], ["p", "Server"], ["l", "AI"], ["d", "Data + cloud"]].map(([k, n]) => <span key={k} className="chip sm" style={{ borderColor: TC[k] }}><i className="dot" style={{ background: TC[k] }} />{n}</span>)}</div>
      <div className="g4">{TS.map(([a, b, c, k], i) => <div key={a} className="tile" tabIndex={0} style={{ borderLeftColor: TC[k], transform: h === i ? "translate(-3px,-3px)" : "none" }} onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)} onFocus={() => setH(i)} onBlur={() => setH(null)}><small>{a}</small><b>{b}</b><small>{c}</small></div>)}</div>
    </>
  );
}

function Roadmap() {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 300); return () => clearTimeout(t); }, []);
  const W = [["Weeks 1 to 2", "Core AI + math", ["FastAPI server", "LangGraph vision extractor", "Pydantic schemas", "Python math + XGBoost waste"], "#2E7DD1"], ["Weeks 3 to 4", "Database + queue", ["PostgreSQL multi-tenancy", "S3 uploads", "Docker containers", "Redis + Celery workers"], "#2F9E6B"], ["Weeks 5 to 6", "Frontend + 3D", ["Split-screen UI", "Canvas bounding boxes", "React-Three-Fiber 3D", "WebSocket chat sync"], "#FF5B1F"], ["Weeks 7 to 8", "Billing + exports", ["Clerk auth", "Stripe $99 webhooks", "15-page PDF templates", "Deploy to DigitalOcean / ECS"], "#7A4FD6"]];
  return (
    <>
      <Head tag="the plan">Live in 8 weeks</Head>
      <div style={{ position: "relative", height: 10, background: "rgba(20,48,90,.15)", borderRadius: 9 }}><div style={{ height: "100%", width: go ? "100%" : 0, background: "var(--org)", borderRadius: 9, transition: "width 3.2s ease" }} /></div>
      <div className="g4">{W.map(([w, t, l, c], i) => <div key={w} className="tile pop" style={{ borderLeftColor: c, animationDelay: i * 0.5 + "s", alignItems: "flex-start" }}><span className="hand" style={{ fontSize: 24, color: c }}>{w}</span><b style={{ fontSize: 19 }}>{t}</b><ul className="bl sm">{l.map(x => <li key={x}>{x}</li>)}</ul></div>)}</div>
    </>
  );
}

function Scale() {
  const [k] = useTick(900, 6);
  const n = 1 + [0, 1, 3, 5, 3, 1][k];
  return (
    <>
      <Head tag="after launch">Keeping it running</Head>
      <div className="g3">
        <Win title="Auto-scaling workers"><div className="wk">{[...Array(8)].map((_, i) => <i key={i} className={i < n ? "on" : ""} />)}</div><p className="cap">Uploads spike, extra Celery containers start.</p></Win>
        <Win title="Prompt monitoring">{[["Standard plan", 1], ["Scanned plan", 1], ["Hand-drawn plan", 0], ["Standard plan", 1]].map(([a, ok], i) => <div key={i} className="trow two" style={i === 2 ? { animation: "blink 1.2s infinite" } : null}><span>{a}</span><b style={{ color: ok ? "var(--ok)" : "var(--red)" }}>{ok ? "OK" : "Failed"}</b></div>)}<p className="cap">LangSmith flags failures so we refine prompts.</p></Win>
        <Win title="Backups + alerts"><div className="disp" style={{ fontSize: 44 }}>99.9%</div><ul className="bl sm"><li>Daily PostgreSQL snapshots</li><li>Sentry error alerts</li><li>Minimal manual upkeep</li></ul></Win>
      </div>
    </>
  );
}

function Close() {
  const r = useTween(1, 2200, 0);
  return (
    <div className="g2" style={{ minHeight: "calc(100vh - 190px)" }}>
      <div><div className="hand note">{PRODUCT}</div><h1 className="disp">Plan in.<br />Home out.</h1>
        <ul className="bl" style={{ margin: "22px 0" }}><li>3D home, exact materials, live budget</li><li>Cost tools that cut real money</li><li>Photoreal renders that sell the vision</li><li>Built in 8 weeks, ready to scale</li></ul>
        <div className="hand sticky">Questions?</div></div>
      <Iso rise={r} />
    </div>
  );
}

/* ───────────── deck ───────────── */
const SLIDES = [
  { p: "The product", t: "Plan in. Home out.", C: Hero, dark: 1 }, { p: "The product", t: "The big idea", C: Idea }, { p: "The product", t: "Who it is for", C: Who }, { p: "The product", t: "How it works", C: Steps }, { p: "The product", t: "The live screen", C: Workspace },
  { p: "Features", t: "2D to 3D", C: ThreeD }, { p: "Features", t: "Chat-to-Change", C: Chat }, { p: "Features", t: "Click-to-Verify", C: Verify }, { p: "Features", t: "Vibe presets", C: Presets }, { p: "Features", t: "Photoreal renders", C: Render }, { p: "Features", t: "Snap-to-Match", C: Snap },
  { p: "Features", t: "Wall knockdown", C: Wall }, { p: "Features", t: "Sun and light", C: Sun }, { p: "Features", t: "Budget-Lock", C: Budget }, { p: "Features", t: "Side-by-side", C: Compare }, { p: "Features", t: "Money heatmap", C: Heat }, { p: "Features", t: "DIY switch", C: DIY }, { p: "Features", t: "Country switch", C: Country },
  { p: "Features", t: "Loan book + quote", C: Docs1 }, { p: "Features", t: "Schedule + emails", C: Docs2 },
  { p: "Workflow", t: "System architecture", C: Arch, dark: 1 }, { p: "Workflow", t: "Phase 1: Access", C: P1 }, { p: "Workflow", t: "Phase 2: Ingestion", C: P2 }, { p: "Workflow", t: "Phase 3: Agents", C: P3 }, { p: "Workflow", t: "Phase 4: Workspace", C: P4 }, { p: "Workflow", t: "Phase 5: Exports", C: P5 },
  { p: "How we build it", t: "One JSON runs it all", C: JsonSlide }, { p: "How we build it", t: "Cost tools", C: () => <Impl tag="how we build the money tools" title="Cost-cutting, step by step" items={COST} /> }, { p: "How we build it", t: "Visual tools", C: () => <Impl tag="how we build the visual tools" title="Visualization, step by step" items={VIZ} /> },
  { p: "How we build it", t: "Credits + margins", C: Credits }, { p: "How we build it", t: "Tech stack", C: Stack }, { p: "How we build it", t: "8-week build", C: Roadmap }, { p: "How we build it", t: "Keeping it running", C: Scale }, { p: "The end", t: "Thank you", C: Close, dark: 1 },
];

export default function Deck() {
  const [i, setI] = useState(0), [ov, setOv] = useState(false);
  const N = SLIDES.length;
  const go = useCallback(d => setI(x => clamp(x + d, 0, N - 1)), [N]);
  useEffect(() => {
    const k = e => {
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === "g" || e.key === "G") setOv(o => !o);
      else if (e.key === "Escape") setOv(false);
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [go]);
  const tx = useRef(null);
  const S = SLIDES[i], C = S.C;
  return (
    <div className={cx("pw", S.dark && "dk")}
      onTouchStart={e => { tx.current = e.target.closest("input,.noswipe") ? null : e.touches[0].clientX; }}
      onTouchEnd={e => { if (tx.current === null) return; const d = e.changedTouches[0].clientX - tx.current; if (Math.abs(d) > 80) go(d < 0 ? 1 : -1); tx.current = null; }}>
      <style>{CSS}</style><Defs />
      <div className="chrome"><span className="hand">{S.p}</span><span>{i + 1} / {N}</span></div>
      <div key={i} className={cx("slide", S.dark && "dark")}><div className="inner"><C /></div></div>
      <div className="bar">
        <button className="nb" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous slide">‹</button>
        <div className="ticks">{SLIDES.map((s, k) => <button key={k} className={cx("tick", k === i && "on", k % 5 === 0 && "big")} onClick={() => setI(k)} title={s.t} aria-label={`Go to ${s.t}`} />)}</div>
        <button className="nb" onClick={() => go(1)} disabled={i === N - 1} aria-label="Next slide">›</button>
        <button className="nb sm" onClick={() => setOv(true)} aria-label="All slides">▦</button>
      </div>
      {ov && <div className="ov" onClick={() => setOv(false)}><div className="ovg" onClick={e => e.stopPropagation()}>{SLIDES.map((s, k) => <button key={k} className={cx("ovc", k === i && "on")} onClick={() => { setI(k); setOv(false); }}><span className="hand">{k + 1}</span><b>{s.t}</b><small>{s.p}</small></button>)}</div></div>}
    </div>
  );
}

/* ───────────── styles ───────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Caveat:wght@600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap');
.pw{--ink:#14305A;--paper:#F3F6F8;--bp:#0D2A52;--org:#FF5B1F;--sun:#F5C542;--ok:#2F9E6B;--red:#E8402A;position:fixed;inset:0;color:var(--ink);background:var(--paper);font-family:'Instrument Sans',system-ui,sans-serif;overflow:hidden}
.pw.dk{--ink:#DCE9FF;background:var(--bp)}
.pw *{box-sizing:border-box}.pw button{font-family:inherit}
.hand{font-family:'Caveat','Segoe Print','Bradley Hand',cursive;font-weight:700}
.disp{font-family:'Bricolage Grotesque','Instrument Sans',system-ui,sans-serif;font-weight:800;letter-spacing:-.025em;line-height:1.02;margin:0}
h2.disp{font-size:clamp(28px,4.2vw,54px)}h1.disp{font-size:clamp(52px,9vw,118px);line-height:.92}
.slide{position:absolute;left:0;right:0;top:0;bottom:60px;overflow:auto;padding:54px clamp(18px,5vw,72px) 28px;--roomfill:#fff;--floordef:#E6EDF5;--wa:#F7F9FC;--wb:#C9D5E4;background-color:var(--paper);background-image:linear-gradient(rgba(20,48,90,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(20,48,90,.07) 1px,transparent 1px);background-size:32px 32px}
.slide.dark{--ink:#DCE9FF;--roomfill:rgba(255,255,255,.05);--floordef:#1A4A86;--wa:#3C74B8;--wb:#2A5A98;background-color:var(--bp);color:var(--ink);background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px)}
.inner{max-width:1260px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;justify-content:center;gap:22px}
.chrome{position:absolute;top:10px;left:0;right:0;z-index:5;padding:0 clamp(18px,5vw,72px);display:flex;justify-content:space-between;font-size:13px;pointer-events:none}.chrome .hand{font-size:20px}
.note{font-size:clamp(22px,2.2vw,30px);color:var(--org);transform:rotate(-2deg);display:inline-block;margin-bottom:6px}
.lead{font-size:clamp(17px,1.8vw,23px);line-height:1.35;max-width:30em;margin:16px 0}
.g2{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:36px;align-items:center}
.g2e{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:center}
.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:stretch}
.g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
@media(max-width:900px){.g2,.g2e,.g3{grid-template-columns:1fr}.g4{grid-template-columns:1fr 1fr}.ws{grid-template-columns:1fr!important}}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.bl{list-style:none;padding:0;margin:0;display:grid;gap:12px}.bl li{display:flex;gap:12px;font-size:clamp(16px,1.55vw,21px);line-height:1.3}
.bl li:before{content:"";flex:none;width:10px;height:10px;margin-top:.45em;background:var(--org);transform:rotate(45deg)}
.bl.sm li{font-size:14px;gap:8px}.bl.sm{gap:6px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border:1.5px solid var(--ink);border-radius:99px;font-size:14px;font-weight:600;background:#fff;color:#14305A}
.chip.sm{padding:3px 10px;font-size:12px}.chip.on{background:var(--org);color:#fff;border-color:var(--org)}.chip.clk{cursor:pointer}.dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.btn{font-weight:700;padding:10px 16px;border:1.5px solid #14305A;border-radius:8px;background:#fff;color:#14305A;cursor:pointer;box-shadow:3px 3px 0 #14305A;transition:transform .1s,box-shadow .1s;font-size:14px}
.btn.sm{padding:5px 11px;font-size:12px;box-shadow:2px 2px 0 #14305A}.btn.pri{background:var(--org);color:#fff}.btn:active{transform:translate(2px,2px);box-shadow:0 0 0 #14305A}.btn:disabled{opacity:.6}
.btn:focus-visible,.tick:focus-visible,.nb:focus-visible,.tab:focus-visible,.sw:focus-visible,.tile:focus-visible{outline:3px solid var(--sun);outline-offset:2px}
.win{--ink:#14305A;--roomfill:#fff;--floordef:#E6EDF5;--wa:#F7F9FC;--wb:#C9D5E4;background:#fff;color:#14305A;border:1.5px solid #14305A;border-radius:10px;box-shadow:6px 6px 0 rgba(20,48,90,.9);overflow:hidden;min-width:0}
.dark .win{box-shadow:6px 6px 0 rgba(0,0,0,.45)}
.wbar{display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1.5px solid #14305A;font-size:13px;font-weight:700;background:#EAF0F7}
.wbar i{width:10px;height:10px;border-radius:50%;border:1.5px solid #14305A;display:inline-block}.wbar span:first-of-type{margin-left:8px}
.sticky{background:var(--sun);color:#14305A;padding:10px 16px;transform:rotate(-2deg);box-shadow:3px 3px 0 rgba(20,48,90,.3);font-size:26px;display:inline-block;max-width:340px}
.card{background:#fff;color:#14305A;border:1.5px solid #14305A;border-radius:10px;padding:20px;box-shadow:5px 5px 0 #14305A}
.cap{font-size:13px;margin:10px 0 0;opacity:.8}
.tbl{display:grid;font-size:13px}.trow{display:grid;grid-template-columns:1.5fr 1fr .9fr;gap:8px;padding:7px 8px;border-bottom:1px solid rgba(20,48,90,.18);align-items:center;transition:background .3s}
.trow.two{grid-template-columns:1fr auto}.trow.th{font-weight:700;background:#EAF0F7}.trow.clk{cursor:pointer}.trow.clk:hover{background:rgba(255,91,31,.08)}.trow.on{background:rgba(255,91,31,.18)}
.trow small{display:block;opacity:.65}.qi{width:62px;border:1.5px solid #14305A;border-radius:4px;padding:2px 4px;font:inherit;font-size:12px}
.trk{height:10px;background:rgba(20,48,90,.15);border-radius:6px;overflow:hidden}.trk>div{height:100%;border-radius:6px}.trk.big{height:16px}
.inp{flex:1;min-width:140px;border:1.5px solid #14305A;border-radius:8px;padding:8px 10px;font:inherit;font-size:14px}
.sw{width:44px;height:24px;border-radius:99px;border:1.5px solid #14305A;background:#fff;position:relative;cursor:pointer;padding:0;flex:none}
.sw:after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#14305A;transition:transform .2s}.sw.on{background:var(--org)}.sw.on:after{transform:translateX(20px);background:#fff}
.tabs{display:grid;gap:8px}.tab{text-align:left;border:1.5px solid var(--ink);border-radius:8px;background:transparent;color:var(--ink);padding:10px 14px;cursor:pointer;display:grid;gap:2px;font-size:15px}
.tab small{opacity:.75;font-size:12px}.tab.on{background:var(--org);border-color:var(--org);color:#fff;box-shadow:4px 4px 0 var(--ink)}
.ws{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:14px;align-items:start}.lab{font-size:22px;color:var(--org)}
.chatbar{margin-top:10px;display:flex;gap:12px;align-items:center;border:1.5px dashed #14305A;border-radius:8px;padding:8px 12px;font-size:14px}.chatbar .hand{color:var(--org);font-size:22px}
.caret{display:inline-block;width:2px;height:1.1em;background:currentColor;margin-left:3px;vertical-align:middle;animation:blink 1s steps(1) infinite}
.log{display:grid;gap:6px;margin-top:10px;min-height:20px}.bub{background:#EAF0F7;border-radius:10px;padding:7px 10px;font-size:13px;max-width:92%}.bub.u{background:var(--org);color:#fff;justify-self:end}
.callout{margin-top:10px;padding:9px 12px;border:1.5px solid #14305A;border-radius:8px;background:var(--sun);font-size:14px;animation:pop .4s ease both}
.stat{border:1.5px solid #14305A;border-radius:8px;padding:8px 10px}.stat .disp{font-size:26px}
.stage{display:grid;gap:14px;justify-items:center;align-content:center;min-height:250px}
.dz{width:100%;min-height:150px;border:2.5px dashed var(--org);border-radius:12px;display:grid;place-items:center;align-content:center;gap:10px;overflow:hidden}
.fileb{border:1.5px solid #14305A;border-radius:6px;padding:6px 12px;font-weight:700;animation:dropf 1.1s ease-out both;background:#fff}
.stripe{background:#635BFF;color:#fff;padding:8px 16px;border-radius:8px;font-weight:600;animation-fill-mode:both}
.scanl{position:absolute;top:0;bottom:0;width:3px;background:var(--org);box-shadow:0 0 16px 4px rgba(255,91,31,.6);animation:scanx 2.4s linear infinite}
.flowv{display:grid;gap:6px}.fv{display:flex;gap:10px;padding:7px 10px;border-left:3px solid rgba(20,48,90,.2);opacity:.5;transition:all .3s;align-items:center}.fv small{display:block;opacity:.75;font-size:12px}
.fv.on{opacity:1;border-left-color:var(--org);background:rgba(255,91,31,.1)}.fv.done{opacity:.85;border-left-color:var(--ok)}
.fvn{flex:none;width:24px;height:24px;border-radius:50%;background:#14305A;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700}.fv.on .fvn{background:var(--org)}
.code,pre.code{background:#0D2A52;color:#DCE9FF;font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:12.5px;border-radius:8px;padding:12px;margin:10px 0 0;overflow:auto;white-space:pre}
.code.big{font-size:clamp(11px,1.25vw,15px);padding:16px}.cl{padding:3px 8px;border-left:4px solid transparent;display:flex;justify-content:space-between;gap:10px;transition:background .3s}
.cl.w{background:rgba(255,91,31,.3);border-left-color:var(--org)}.cl.r{background:rgba(46,125,209,.35);border-left-color:#5AA3F0}.cl em{font-style:normal;font-size:11px;opacity:.9}
.tile{border:1.5px solid var(--ink);border-left:6px solid;border-radius:8px;padding:12px 14px;display:grid;gap:4px;background:#fff;color:#14305A;transition:transform .15s;box-shadow:3px 3px 0 var(--ink)}.tile small{opacity:.75}
.dots{display:grid;grid-template-columns:repeat(10,1fr);gap:6px}.dots i{aspect-ratio:1;border-radius:50%;border:1.5px solid #14305A;background:transparent}.dots i.on{background:var(--org);border-color:var(--org)}
.wk{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.wk i{height:44px;border:1.5px dashed #14305A;border-radius:6px;opacity:.35;transition:all .3s}.wk i.on{background:var(--ok);border:1.5px solid #14305A;opacity:1}
.pg{width:190px;height:260px;background:#fff;border:1.5px solid #14305A;padding:12px;font-size:10px;color:#14305A;display:grid;align-content:start;gap:8px;box-shadow:4px 4px 0 rgba(20,48,90,.9);--roomfill:#fff;--floordef:#E6EDF5;--wa:#F7F9FC;--wb:#C9D5E4;--ink:#14305A}
.ln{height:6px;background:rgba(20,48,90,.22);border-radius:3px}.logo{border:1.5px dashed #14305A;padding:3px 8px;font-weight:700;font-size:10px}
.gr{display:grid;grid-template-columns:130px 1fr;gap:8px;align-items:center;margin-bottom:6px}.gt{position:relative;height:16px;background:rgba(20,48,90,.1);border-radius:4px;overflow:hidden}
.mail{margin:0;font-family:inherit;font-size:13px;white-space:pre-wrap;min-height:150px}
.polaroid{background:#fff;padding:8px 8px 22px;border:1.5px solid #14305A;transform:rotate(-2deg);box-shadow:4px 4px 0 rgba(20,48,90,.9);position:relative;--ink:#14305A}
.tape{position:absolute;top:-12px;left:50%;width:70px;height:22px;background:rgba(245,197,66,.8);transform:translateX(-50%) rotate(3deg)}
.dbox{position:absolute;border:2.5px solid var(--org);border-radius:4px;background:rgba(255,91,31,.12)}
.legend{height:10px;border-radius:6px;background:linear-gradient(90deg,#9CC4F0,#E8402A);margin-top:10px}
.march{animation:march 1s linear infinite}
.bar{position:absolute;left:0;right:0;bottom:0;height:60px;display:flex;align-items:center;gap:6px;padding:0 10px;border-top:1.5px solid var(--ink);background:var(--paper);z-index:10}
.pw.dk .bar{background:var(--bp)}
.ticks{flex:1;display:flex;height:100%;min-width:0}
.tick{flex:1;min-width:3px;background:none;border:0;padding:0;position:relative;cursor:pointer}
.tick:after{content:"";position:absolute;left:50%;bottom:10px;width:2px;height:10px;background:var(--ink);opacity:.45;transform:translateX(-50%)}.tick.big:after{height:18px}.tick.on:after{background:var(--org);height:32px;width:4px;opacity:1}
.nb{width:38px;height:38px;border-radius:8px;border:1.5px solid var(--ink);background:transparent;color:var(--ink);font-size:22px;cursor:pointer;line-height:1}.nb:disabled{opacity:.3}.nb.sm{font-size:16px}
.ov{position:absolute;inset:0;background:rgba(10,25,50,.9);z-index:20;overflow:auto;padding:30px}
.ovg{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.ovc{text-align:left;background:#fff;color:#14305A;border:1.5px solid #14305A;border-radius:8px;padding:10px 12px;display:grid;gap:2px;cursor:pointer}.ovc.on{background:var(--org);color:#fff}.ovc .hand{font-size:22px}.ovc small{opacity:.7}
@keyframes dr{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.draw{fill:none;stroke-dasharray:1;stroke-dashoffset:1;animation:dr 1.3s ease forwards}
@keyframes fi{from{opacity:0}to{opacity:1}}.fi{animation:fi .6s ease both}
@keyframes march{to{stroke-dashoffset:-24}}
.neon{fill:rgba(255,91,31,.16);stroke:#FF5B1F;stroke-width:3;stroke-dasharray:8 5;animation:march .8s linear infinite;filter:drop-shadow(0 0 4px rgba(255,91,31,.7))}
@keyframes pop{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}.pop{animation:pop .5s ease both;transform-origin:center}
@keyframes scanx{from{left:0}to{left:100%}}
@keyframes dropf{from{transform:translateY(-90px);opacity:0}to{transform:none;opacity:1}}
@keyframes blink{50%{opacity:0}}
@media(prefers-reduced-motion:reduce){.pw *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;
