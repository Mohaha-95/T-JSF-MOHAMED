import React, { useState, useEffect } from 'react';
import './Hometalk.css';
import ChatComponent from './Chatcomponent';
import socket from './socket';

function Hometalk() {
  const [username, setUsername] = useState('');
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);

  // Fonction pour rafraîchir la liste des channels
  const fetchChannels = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:5000/api/channels?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setChannels(data);
        if (!activeChannel && data.length > 0) setActiveChannel(data[0]);
        if (activeChannel && !data.find(c => c._id === activeChannel._id)) setActiveChannel(data[0] || null);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des channels:', err);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/auth/userinfo', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.status === 200) {
          setUsername(data.username);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
      }
    };
    
    // Enregistrer l'utilisateur avec le socket pour recevoir les messages système
    const userId = localStorage.getItem('userId');
    if (userId) {
      socket.emit('registerUser', userId);
      console.log('✅ Utilisateur enregistré avec le socket:', userId);
    }
    
    fetchUserInfo();
    fetchChannels();
    // eslint-disable-next-line
  }, []);

  // Join le channel actif côté socket
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (activeChannel && userId) {
      socket.emit('joinChannel', { userId, channelId: activeChannel._id });
      return () => {
        socket.emit('quitChannel', { userId, channelId: activeChannel._id });
      };
    }
  }, [activeChannel]);

  const handleChannelClick = (channel) => {
    setActiveChannel(channel);
  };

  // Ajout : sélection automatique du channel après join/quit
  useEffect(() => {
    if (channels.length > 0 && (!activeChannel || !channels.find(c => c._id === activeChannel._id))) {
      setActiveChannel(channels[0]);
    }
  }, [channels]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/log';
  };

  return (
    <div className="hometalk-container">
      <div className="mochat-logo">MoChat</div>
      <div className="channel-box">
        <h3>Canaux</h3>
        <ul>
          {channels.length === 0 && <li className="channel-item">Aucun channel disponible. Utilisez /create pour en créer un.</li>}
          {channels.map(channel => (
            <li key={channel._id} className={`channel-item${activeChannel && activeChannel._id === channel._id ? ' active' : ''}`} onClick={() => handleChannelClick(channel)}>
              {channel.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="profile-card">
        <h2 className="username">
          <div className="user-logo">
            {username ? username.charAt(0).toUpperCase() : 'U'}
          </div>
          {username}
        </h2>
      </div>
      <button className="logout-button" onClick={handleLogout}>
        Se déconnecter
      </button>
      <div className="content">
        <ChatComponent username={username} channel={activeChannel} channels={channels} setChannels={setChannels} fetchChannels={fetchChannels} />
      </div>
    </div>
  );
}

export default Hometalk;
