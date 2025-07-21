import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook pour gérer la navigation
import './Log.css';

function Log() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // Initialisation du hook pour naviguer

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      setMessage('Veuillez remplir tous les champs.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.status === 200) {
        // Vérification si les données nécessaires sont présentes
        if (!data.token || !data.userId || !data.user.username) {
          console.error("❌ Données utilisateur manquantes dans la réponse de l'API", data);
          setMessage("Erreur lors de la récupération des informations utilisateur.");
          setLoading(false);
          return;
        }

        // Stockage des données utilisateur
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.user.username);

        console.log("✅ Connexion réussie !");
        console.log("🔹 Token :", data.token);
        console.log("🔹 userId :", data.userId);
        console.log("🔹 username :", data.user.username);

        setMessage('Connexion réussie');

        // Redirection vers la page HomeTalk
        navigate('/hometalk');
      } else {
        setMessage(data.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la connexion :', error);
      setMessage('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="app-name">
          <span className="app-logo">💬</span>
          MoChat
        </h1>
        <h2 className="form-title">Connecte-toi</h2>
        <form onSubmit={handleSubmit} className="login-form">
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
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        {message && <p className="message">{message}</p>}
        <p className="signup-link">
          Pas encore de compte ? <a href="/signup">Inscris-toi</a>
        </p>
      </div>
    </div>
  );
}

export default Log;
