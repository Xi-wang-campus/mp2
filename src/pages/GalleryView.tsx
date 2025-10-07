import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import { FlavorItem, searchBeans } from '../services/api';
import { Link } from 'react-router-dom';

export default function GalleryView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FlavorItem[]>([]);
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true); setError(null);
      try {
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(x => { if (x.category) set.add(x.category); });
    return ['all', ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    if (category === 'all') return items;
    return items.filter(x => x.category === category);
  }, [items, category]);

  return (
    <div className="container">
      <header className="App-header">
        <h1>Gallery</h1>
        <p className="lead">Image gallery with category filtering.</p>
      </header>

      <main className="container">
        <section className="card" style={{ marginBottom: 16 }}>
          <label className="label">Filter by Category</label>
          <select className="field" value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </section>

        {loading && <div className="state">Loading…</div>}
        {error && <div className="state error">Error: {error}</div>}
        {!loading && !error && filtered.length === 0 && <div className="state">No results.</div>}

        <div className="grid">
          {filtered.map(it => (
            <article className="card" key={it.id}>
              {it.image && <img src={it.image} alt={it.name} style={{ width: '100%', borderRadius: 12, marginBottom: 8 }} />}
              <h3 className="card-title">{it.name}</h3>
              <p className="muted">{it.category ?? 'uncategorized'}</p>
              <div className="card-actions">
                <Link className="btn" to={`/detail/${it.id}`}>Details</Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}


