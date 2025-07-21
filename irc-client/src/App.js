import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from './Signup'; // Composant d'inscription
import Log from './Log';       // Composant de connexion
import Home from './Home';     // Composant d'accueil
import Hometalk from './Hometalk'; // Composant Hometalk avec la boîte de chat
import ChatComponent from './Chatcomponent'; // Le composant Chat

function App() {
  return (
    <Router>
      <div>
        <Routes>
          {/* Route pour la page d'accueil */}
          <Route path="/" element={<Home />} />
          {/* Route pour la page d'inscription */}
          <Route path="/signup" element={<Signup />} />
          {/* Route pour la page de connexion */}
          <Route path="/log" element={<Log />} />
          {/* Route pour la page Hometalk avec la box de chat */}
          <Route path="/hometalk" element={<Hometalk />}>
            <Route path="chat" element={<ChatComponent />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
