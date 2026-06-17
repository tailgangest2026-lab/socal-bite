/* =========================================================
   CONDITIONS PAGE
   ========================================================= */
.conditions-hero {
  max-width: 1280px;
  margin: 0 auto;
  padding: 80px 28px 40px;
}
.conditions-hero p { max-width: 780px; color: var(--soft); line-height: 1.7; font-size: 1.15rem; }

.hidden-select { display: none; }

.conditions-dashboard {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 28px 60px;
  display: grid;
  grid-template-columns: 370px 1fr;
  gap: 24px;
}

.now-card {
  padding: 30px;
  border-radius: var(--r-2xl);
  border: 1px solid var(--border-strong);
  background:
    radial-gradient(circle at top right, rgba(32,211,226,0.16), transparent 38%),
    linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035));
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(14px);
}
.now-card > span {
  color: var(--cyan);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2.4px;
  font-size: 0.74rem;
}
.now-card h2 { margin: 14px 0 34px; font-size: 2.2rem; font-weight: 900; letter-spacing: -0.025em; }

.now-temp-row strong {
  display: block;
  font-size: clamp(3.6rem, 7vw, 5rem);
  background: var(--grad-gold);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.035em;
}
.now-temp-row span { color: var(--muted); }

.all-regions-panel {
  max-width: 1280px;
  margin: 0 auto;
  padding: 10px 28px 80px;
}
.all-regions-panel h2 { font-size: 2.3rem; font-weight: 900; letter-spacing: -0.025em; }
.all-regions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.condition-region-card { min-height: 250px; }

@media (max-width: 1050px) {
  .conditions-dashboard { grid-template-columns: 1fr; }
  .all-regions-grid     { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 700px) {
  .conditions-hero,
  .conditions-dashboard,
  .all-regions-panel { padding-left: 16px; padding-right: 16px; }
  .all-regions-grid  { grid-template-columns: 1fr; }
}
.temp-split-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin: 24px 0 18px;
}

.temp-box {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
}

.temp-box small {
  display: block;
  color: var(--soft);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.temp-box strong {
  display: block;
  font-size: clamp(2.8rem, 7vw, 5rem);
  color: var(--gold);
  line-height: 1;
  margin-top: 8px;
}

.temp-box span {
  display: block;
  margin-top: 8px;
  color: var(--muted);
  font-size: 0.95rem;
}
.region-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.region-filter-row .forecast-tabs {
  flex: 1;
}

.date-filter-inline {
  flex-shrink: 0;
}

.region-filter-row .conditions-date-select,
.date-filter-inline .conditions-date-select {
  min-width: 170px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06);
  color: var(--white);
  font-weight: 700;
  cursor: pointer;
}

.region-filter-row .conditions-date-select:hover,
.date-filter-inline .conditions-date-select:hover {
  border-color: rgba(255,255,255,0.3);
}

@media (max-width: 768px) {
  .region-filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .date-filter-inline {
    width: 100%;
  }

  .region-filter-row .conditions-date-select,
  .date-filter-inline .conditions-date-select {
    width: 100%;
  }
}
/* =========================================================
   RANKINGS PAGE
   ========================================================= */
.rankings-hero {
  max-width: 1280px;
  margin: 0 auto;
  padding: 80px 28px 40px;
}
.rankings-hero p { max-width: 820px; color: var(--soft); line-height: 1.7; font-size: 1.15rem; }

.ranking-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-top: 34px;
  max-width: 850px;
}
.ranking-kpis article {
  padding: 18px;
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.045);
  transition: background var(--t-fast), border-color var(--t-fast), transform var(--t-fast);
}
.ranking-kpis article:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(32,211,226,0.30);
  transform: translateY(-2px);
}
.ranking-kpis span {
  display: block;
  color: var(--muted);
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 1.3px;
  font-weight: 900;
  margin-bottom: 10px;
}
.ranking-kpis strong { font-size: 1.8rem; font-weight: 900; letter-spacing: -0.02em; }

.rankings-panel {
  max-width: 1280px;
  margin: 0 auto;
  padding: 34px 28px 80px;
}

.rankings-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.rank-toggle {
  display: flex;
  gap: 6px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.04);
  border-radius: 16px;
  padding: 6px;
}
.rank-toggle button {
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  background: transparent;
  color: var(--soft);
  font-weight: 800;
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast);
}
.rank-toggle button:hover { background: rgba(255,255,255,0.06); color: var(--white); }
.rank-toggle button.active {
  background: var(--grad-cyan);
  color: #031828;
  box-shadow: 0 6px 18px rgba(32,211,226,0.30);
}

.rank-controls {
  display: flex;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}

/* Inputs / selects */
.rank-controls input,
.rank-controls select,
.price-controls select {
  height: 46px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.05);
  color: var(--white);
  padding: 0 14px;
  font-weight: 700;
  font-family: inherit;
  transition: border-color var(--t-fast), background var(--t-fast), box-shadow var(--t-fast);
  appearance: none;
  -webkit-appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--soft) 50%),
    linear-gradient(135deg, var(--soft) 50%, transparent 50%);
  background-position: calc(100% - 18px) 50%, calc(100% - 13px) 50%;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 36px;
}
.rank-controls input {
  background-image: none;
  padding-right: 14px;
  min-width: 320px;
}
.rank-controls input:hover,
.rank-controls select:hover,
.price-controls select:hover {
  border-color: rgba(32,211,226,0.35);
  background-color: rgba(255,255,255,0.08);
}
.rank-controls input:focus,
.rank-controls select:focus,
.price-controls select:focus {
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px rgba(32,211,226,0.18);
  outline: none;
}
.rank-controls input::placeholder { color: var(--muted); }

/* Tables */
.ranking-table-wrap,
.report-table-wrap,
.price-table-wrap {
  overflow-x: auto;
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.025);
  box-shadow: var(--shadow-sm);
  -webkit-overflow-scrolling: touch;
}

.ranking-table,
.report-table,
.price-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}
.ranking-table th,
.report-table th,
.price-table th {
  color: var(--muted);
  text-align: left;
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 1.4px;
  padding: 16px;
  background: rgba(0,0,0,0.25);
  font-weight: 900;
  position: sticky;
  top: 0;
  z-index: 1;
}
.ranking-table td,
.report-table td,
.price-table td {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-weight: 600;
}
.ranking-table tr,
.price-table tr,
.report-table tr { transition: background var(--t-fast); }
.ranking-table tr:hover,
.price-table tr:hover,
.report-table tr:hover { background: rgba(32,211,226,0.07); }

.rank-name-link strong,
.rank-name-link span { display: block; }
.rank-name-link strong { color: var(--white); font-weight: 800; }
.rank-name-link span   { color: var(--muted); font-size: 0.86rem; margin-top: 3px; }
.rank-name-link:hover strong { color: var(--cyan); }

.rank-medal {
  display: grid;
  place-items: center;
  width: 34px; height: 34px;
  border-radius: 50%;
  background: var(--grad-gold);
  color: #031828;
  font-weight: 900;
  box-shadow: 0 6px 14px rgba(244,189,95,0.35);
}

.trip-pill,
.fpa-pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.8rem;
  border: 1px solid var(--border);
  font-weight: 800;
  background: rgba(255,255,255,0.05);
}
.fpa-pill {
  color: var(--green);
  background: rgba(65,245,162,0.12);
  border-color: rgba(65,245,162,0.30);
}

@media (max-width: 850px) {
  .ranking-kpis { grid-template-columns: repeat(2, 1fr); }
  .rankings-toolbar { align-items: stretch; flex-direction: column; }
  .rank-controls { justify-content: stretch; flex-direction: column; }
  .rank-controls input { min-width: 0; width: 100%; }
}
.custom-date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-date-range.hidden {
  display: none;
}

.rank-controls select,
.rank-controls input[type="date"] {
  padding: 10px 14px;
  border-radius: 10px;
}
