import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="home-box">
        <h1 className="home-title">Bienvenue sur MoChat</h1>
        <p className="home-tagline">La plateforme de chat moderne et élégante pour échanger avec le monde.</p>
        <div className="home-buttons">
          <a href="/log" className="home-button">Connexion</a>
          <a href="/signup" className="home-button home-button-secondary">Inscription</a>
        </div>
      </div>
    </div>
  );
}

export default Home;
