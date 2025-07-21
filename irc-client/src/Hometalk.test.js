import React from 'react';
import { render, screen } from '@testing-library/react';
import Hometalk from './Hometalk';

// Mock du localStorage et du socket pour éviter les effets de bord
beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });
});
jest.mock('./socket', () => ({ emit: jest.fn(), on: jest.fn(), off: jest.fn() }));

describe('Hometalk', () => {
  it('affiche les éléments principaux', () => {
    render(<Hometalk />);
    expect(screen.getByText(/MoChat/i)).toBeInTheDocument();
    expect(screen.getByText(/Canaux/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se déconnecter/i })).toBeInTheDocument();
  });
}); 