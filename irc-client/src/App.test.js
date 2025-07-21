import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('affiche la page d\'accueil par défaut', () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Bienvenue sur MoChat/i)).toBeInTheDocument();
  });

  it('affiche la page de connexion', () => {
    render(
      <MemoryRouter initialEntries={["/log"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Connecte-toi/i)).toBeInTheDocument();
  });

  it('affiche la page d\'inscription', () => {
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Crée ton compte/i)).toBeInTheDocument();
  });
}); 