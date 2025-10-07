import React from 'react';
import './App.css';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import ListView from './pages/ListView';
import GalleryView from './pages/GalleryView';
import DetailView from './pages/DetailView';

// ---------- 类型声明（仅本文件使用） ----------
function App() {
  return (
    <div className="App">
      <nav className="container" style={{ display: 'flex', gap: 12, paddingTop: 16 }}>
        <NavLink className={({ isActive }) => `btn ${isActive ? 'btn--solid' : ''}`} to={'/'} end>List</NavLink>
        <NavLink className={({ isActive }) => `btn ${isActive ? 'btn--solid' : ''}`} to={'/gallery'}>Gallery</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<ListView />} />
        <Route path="/gallery" element={<GalleryView />} />
        <Route path="/detail/:id" element={<DetailView />} />
      </Routes>
    </div>
  );
}

export default App;
