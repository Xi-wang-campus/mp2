import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

test('renders navigation', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const listLink = screen.getByText(/List/i);
  expect(listLink).toBeInTheDocument();
});

