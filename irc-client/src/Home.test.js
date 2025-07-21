import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home', () => {
  it('affiche le titre et le slogan', () => {
    render(<Home />);
    expect(screen.getByText(/Bienvenue sur MoChat/i)).toBeInTheDocument();
    expect(screen.getByText(/La plateforme de chat moderne/i)).toBeInTheDocument();
  });

  it('affiche les boutons Connexion et Inscription', () => {
    render(<Home />);
    expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
    expect(screen.getByText(/Inscription/i)).toBeInTheDocument();
  });
}); 