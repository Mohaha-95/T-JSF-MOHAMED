import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Log from './Log';
import { MemoryRouter } from 'react-router-dom';

describe('Log', () => {
  it('affiche le formulaire de connexion', () => {
    render(
      <MemoryRouter>
        <Log />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
  });

  it('affiche un message d\'erreur si champs manquants', () => {
    render(
      <MemoryRouter>
        <Log />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));
    expect(screen.getByText(/Veuillez remplir tous les champs/i)).toBeInTheDocument();
  });
}); 