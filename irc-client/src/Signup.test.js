import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Signup from './Signup';

describe('Signup', () => {
  it('affiche le formulaire d\'inscription', () => {
    render(<Signup />);
    expect(screen.getByLabelText(/Nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /s'inscrire/i })).toBeInTheDocument();
  });

  it('affiche un message d\'erreur si champs manquants', () => {
    render(<Signup />);
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));
    expect(screen.getByText(/Tous les champs sont obligatoires/i)).toBeInTheDocument();
  });
}); 