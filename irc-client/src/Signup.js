import React, { useState } from 'react';
import './Signup.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // Pour afficher les messages d'erreur ou de succès

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Nom d\'utilisateur :', username);
    console.log('Email :', email);
    console.log('Mot de passe :', password);

    // Vérification des champs avant d'envoyer la requête (facultatif mais recommandé)
    if (!username || !email || !password) {
      setMessage('Tous les champs sont obligatoires');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      // Vérifier la réponse du serveur
      if (response.status === 201) {
        setMessage('Inscription réussie');
      } else {
        setMessage(data.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription :', error);
      setMessage('Erreur serveur');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1 className="app-name">
          <span className="app-logo">💬</span>
          MoChat
        </h1>
        <h2 className="form-title">Crée ton compte</h2>
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ton nom d'utilisateur"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ton email"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ton mot de passe"
              required
            />
          </div>
          <button type="submit" className="submit-btn">S'inscrire</button>
        </form>
        <p className="login-link">
          Déjà un compte ? <a href="/log">Se connecter</a>
        </p>

        {/* Afficher le message d'erreur ou de succès */}
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default Signup;
