import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import { FlavorItem, searchBeans } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';

export default function ListView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState<string>(searchParams.get('q') ?? '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') ?? 'name_asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FlavorItem[]>([]);

  const [page, setPage] = useState<number>(Number(searchParams.get('page') ?? '1') || 1);
  const pageSize = 12;

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        // 拉取一批（较大 pageSize）在前端做模糊筛选，避免后端必须精确匹配导致“pop”无结果
        const res = await searchBeans({ pageIndex: 1, pageSize: 400 });
        if (!ignore) setItems(res.items);
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? 'Unknown error');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (sortBy !== 'name_asc') next.set('sort', sortBy);
    if (page !== 1) next.set('page', String(page));
    setSearchParams(next, { replace: true });
  }, [query, sortBy, page, setSearchParams]);

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = q
      ? items.filter(f =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
        )
      : items.slice();
    switch (sortBy) {
      case 'name_desc': arr.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'id_asc':    arr.sort((a, b) => a.id - b.id); break;
      case 'id_desc':   arr.sort((a, b) => b.id - a.id); break;
      default:          arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  }, [items, query, sortBy]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageData = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, pageSafe]);

  return (
    <div className="container">
      <header className="App-header">
        <h1>Jelly Belly Explorer</h1>
        <p className="lead">Search Jelly Belly flavors, view details, and save favorites.</p>
      </header>

      <main className="container">
        <section className="searchbar card">
          <div className="row">
            <label className="label">Keyword</label>
            <input className="field" value={query} placeholder={'e.g., popcorn, lemon, watermelon'}
                   onChange={e => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <div className="row">
            <label className="label">Sort By</label>
            <select className="field" value={sortBy}
                    onChange={e => { setSortBy(e.target.value); setPage(1); }}>
              <option value="name_asc">Name A→Z</option>
              <option value="name_desc">Name Z→A</option>
              <option value="id_asc">ID ↑</option>
              <option value="id_desc">ID ↓</option>
            </select>
          </div>
        </section>

        {loading && <div className="state">Loading…</div>}
        {error && <div className="state error">Error: {error}</div>}
        {!loading && !error && total === 0 && <div className="state">No results.</div>}

        {!loading && !error && total > 0 && (
          <>
            <section className="results">
              <h2 className="section-title">Results</h2>
              <div className="grid">
                {pageData.map(it => (
                  <article className="card" key={it.id}>
                    {it.image && <img src={it.image} alt={it.name} style={{ width: '100%', borderRadius: 12, marginBottom: 8 }} />}
                    <h3 className="card-title">{it.name}</h3>
                    <p className="muted">{it.description}</p>
                    <div className="card-actions">
                      <Link className="btn" to={`/detail/${it.id}`}>Details</Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <div className="pager">
              <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageSafe <= 1}>◀ Prev</button>
              <span className="pager__text">Page {pageSafe} / {totalPages} · {total} results</span>
              <button className="btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}>Next ▶</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


