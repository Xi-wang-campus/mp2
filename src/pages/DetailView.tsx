import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import { FlavorItem, getBean, RecipeItem, searchBeans, getRelatedByBeanNameSmart } from '../services/api';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function DetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<FlavorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);

  const currentIndex = useMemo(() => {
    const n = Number(id);
    return items.findIndex(x => x.id === n);
  }, [items, id]);

  const current = currentIndex >= 0 ? items[currentIndex] : null;

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

  useEffect(() => {
    let ignore = false;
    (async () => {
      const n = Number(id);
      if (!Number.isFinite(n)) return;
      try {
        const bean = await getBean(n);
        if (bean && !ignore) {
          const combined = await getRelatedByBeanNameSmart(bean.name);
          if (!ignore) setRecipes(combined);
        }
      } catch {
        // ignore recipe errors
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  function gotoPrev() {
    if (currentIndex > 0) navigate(`/detail/${items[currentIndex - 1].id}`);
  }
  function gotoNext() {
    if (currentIndex >= 0 && currentIndex < items.length - 1) navigate(`/detail/${items[currentIndex + 1].id}`);
  }

  return (
    <div className="container">
      <header className="App-header">
        <h1>Detail</h1>
        <p className="lead">Item details with prev/next navigation.</p>
      </header>

      <main className="container">
        {loading && <div className="state">Loading…</div>}
        {error && <div className="state error">Error: {error}</div>}
        {!loading && !error && !current && <div className="state">Not found.</div>}

        {current && (
          <article className="card">
            {current.image && <img src={current.image} alt={current.name} style={{ width: '100%', borderRadius: 12, marginBottom: 8 }} />}
            <h2 className="card-title">{current.name}</h2>
            <p className="muted">ID: {current.id}</p>
            <p>{current.description}</p>
            {current.category && <div className="tags"><span className="tag">{current.category}</span></div>}
            <div className="card-actions">
              <button className="btn" onClick={gotoPrev} disabled={currentIndex <= 0}>◀ Previous</button>
              <button className="btn" onClick={gotoNext} disabled={currentIndex >= items.length - 1}>Next ▶</button>
              <Link className="btn" to={'/'}>Back to List</Link>
            </div>
          </article>
        )}

        {current && (
          <section className="results" style={{ marginTop: 16 }}>
            <h2 className="section-title">Related Recipes & Combinations</h2>
            {recipes.length === 0 ? (
              <div className="state">No related recipes found.</div>
            ) : (
              <ul className="card" style={{ textAlign: 'left' }}>
                {recipes.map(r => (
                  <li key={r.id} style={{ padding: '10px 0', display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                    <span className="tag" style={{ alignSelf: 'start' }}>{r.kind === 'recipe' ? 'Recipe' : 'Combination'}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      {r.description && <div className="muted" style={{ marginTop: 4 }}>{r.description}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}


