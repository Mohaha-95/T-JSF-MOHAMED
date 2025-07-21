import React, { useState, useEffect, useRef } from 'react';
import './Chatcomponent.css';
import socket from './socket';

const ChatComponent = ({ username, channel, channels, setChannels, fetchChannels }) => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');

    if (!storedUserId || !storedUsername) {
        console.warn("⚠️ userId ou username manquant dans localStorage !");
        alert("Votre session a expiré. Veuillez vous reconnecter.");
        // Rediriger l'utilisateur vers la page de connexion si besoin
        // window.location.href = "/login";
    }

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState({}); // { [channelId]: [messages...] }
    const messagesEndRef = useRef(null);
    const lastJoinedChannelRef = useRef(null);

    // Affiche les messages du channel courant
    const currentMessages = channel && channel._id && messages[channel._id] ? messages[channel._id] : (messages['temp'] || []);
    
    // Canal temporaire pour les commandes sans canal sélectionné
    const tempChannelId = 'temp';

    console.log("🔎 Utilisateur :", { storedUsername, storedUserId });

    // Charger l'historique du channel actif
    useEffect(() => {
        if (channel && channel._id) {
            socket.emit('fetchChannelMessages', channel._id);
        }
    }, [channel]);

    // Écoute des messages système pour tous les channels de l'utilisateur
    useEffect(() => {
        const handleSystemMessage = (msg) => {
            if (!msg.channel) return;
            // Log pour debug
            console.log('[SYSTEM] Message reçu:', msg);
            // Affiche le message si le channel courant correspond (comparaison en string)
            if (channel && String(msg.channel) === String(channel._id)) {
                let customText = msg.text;
                if (msg.text && msg.text.includes('a rejoint le channel')) {
                    const user = msg.text.split(' ')[0];
                    customText = `${user} a rejoint le canal, souhaitez-lui la bienvenue !`;
                }
                if (msg.text && msg.text.includes('a quitté le channel')) {
                    const user = msg.text.split(' ')[0];
                    customText = `${user} a quitté le canal.`;
                }
                
                // Éviter les doublons en vérifiant si le message existe déjà
                setMessages(prev => {
                    const currentMessages = prev[channel._id] || [];
                    
                    // Vérifier si le message existe déjà par ID
                    const messageExists = currentMessages.some(existingMsg => 
                        existingMsg._id === msg._id
                    );
                    
                    if (messageExists) {
                        console.log('[SYSTEM] Message déjà présent, ignoré:', customText);
                        return prev;
                    }
                    
                    console.log('[SYSTEM] Nouveau message système ajouté:', customText);
                    return {
                        ...prev,
                        [channel._id]: [...currentMessages, { 
                            ...msg, 
                            system: true, 
                            text: customText
                        }]
                    };
                });
            }
        };
        socket.on('systemMessage', handleSystemMessage);
        return () => {
            socket.off('systemMessage', handleSystemMessage);
        };
    }, [channel]);

    // Écoute des messages du channel, messages système et privés
    useEffect(() => {
        const handleNewMessage = (msg) => {
            if (!msg.channel) return;
            setMessages(prev => ({
                ...prev,
                [msg.channel]: [...(prev[msg.channel] || []), msg]
            }));
        };
        const handleLoadChannelMessages = (msgs) => {
            if (channel && channel._id) {
                setMessages(prev => ({
                    ...prev,
                    [channel._id]: msgs
                }));
            }
        };
        const handlePrivateMessage = (msg) => {
            if (msg.to === storedUserId || msg.userId === storedUserId) {
                if (channel && channel._id) {
                    setMessages(prev => ({
                        ...prev,
                        [channel._id]: [...(prev[channel._id] || []), { 
                            ...msg, 
                            private: true,
                            // Ajouter des informations pour l'affichage
                            isFromMe: msg.userId === storedUserId,
                            otherUser: msg.userId === storedUserId ? msg.toUsername : msg.username
                        }]
                    }));
                }
            }
        };
        socket.on('newMessage', handleNewMessage);
        socket.on('loadChannelMessages', handleLoadChannelMessages);
        socket.on('privateMessage', handlePrivateMessage);
        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('loadChannelMessages', handleLoadChannelMessages);
            socket.off('privateMessage', handlePrivateMessage);
        };
    }, [channel, storedUserId]);

    // À la connexion, envoie l'userId au serveur pour le mapping userId <-> socket.id
    useEffect(() => {
        if (storedUserId) {
            socket.emit('registerUser', storedUserId);
        }
    }, [storedUserId]);

    // S'abonner à la room du channel sélectionné (clic)
    useEffect(() => {
        if (channel && channel._id && storedUserId) {
            if (lastJoinedChannelRef.current !== channel._id) {
                socket.emit('joinChannel', { userId: storedUserId, channelId: channel._id });
                lastJoinedChannelRef.current = channel._id;
            }
        }
    }, [channel?._id, storedUserId]);

    // Scroll automatique
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Gestion de l'envoi de message
    const handleSendMessage = () => {
        if (!storedUserId || !storedUsername) return;
        if (message.trim() === '') return;
        if (message.startsWith('/create ')) {
            const channelName = message.split(' ')[1];
            if (!channelName) return alert('Veuillez spécifier un nom pour le canal.');
            createChannel(channelName);
            return;
        }
        if (message.startsWith('/join ')) {
            const channelName = message.split(' ')[1];
            if (!channelName) return alert('Veuillez spécifier un nom de canal à rejoindre.');
            fetch(`http://localhost:5000/api/channels?all=1`)
                .then(res => res.json())
                .then(data => {
                    // Recherche stricte, insensible à la casse
                    const found = data.find(c => c.name.toLowerCase() === channelName.toLowerCase());
                    if (!found) {
                        setMessages((prev) => ({
                            ...prev,
                            [channel?._id]: [...(prev[channel?._id] || []), { system: true, text: `Channel "${channelName}" introuvable.` }]
                        }));
                        return;
                    }
                    const channelId = found._id;
                    fetch('http://localhost:5000/api/channels/join', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: storedUserId, channelId })
                    }).then(() => {
                        setMessages((prev) => ({
                            ...prev,
                            [channelId]: [...(prev[channelId] || []), { system: true, text: `Rejoint le channel "${channelName}".` }]
                        }));
                        if (fetchChannels) fetchChannels();
                        socket.emit('joinChannel', { userId: storedUserId, channelId });
                    });
                });
            setMessage('');
            return;
        }
        if (message.startsWith('/quit ')) {
            const channelName = message.split(' ')[1];
            if (!channelName) return alert('Veuillez spécifier un nom de canal à quitter.');
            fetch(`http://localhost:5000/api/channels?all=1`)
                .then(res => res.json())
                .then(data => {
                    // Recherche stricte, insensible à la casse
                    const found = data.find(c => c.name.toLowerCase() === channelName.toLowerCase());
                    if (!found) {
                        setMessages((prev) => ({
                            ...prev,
                            [channel?._id]: [...(prev[channel?._id] || []), { system: true, text: `Channel "${channelName}" introuvable.` }]
                        }));
                        return;
                    }
                    const channelId = found._id;
                    fetch('http://localhost:5000/api/channels/quit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: storedUserId, channelId })
                    }).then(() => {
                        setMessages((prev) => ({
                            ...prev,
                            [channelId]: [...(prev[channelId] || []), { system: true, text: `Quitté le channel "${channelName}".` }]
                        }));
                        if (fetchChannels) fetchChannels();
                        socket.emit('quitChannel', { userId: storedUserId, channelId });
                    });
                });
            setMessage('');
            return;
        }
        if (message.startsWith('/msg ')) {
            const [_, toNickname, ...msgParts] = message.split(' ');
            const msgText = msgParts.join(' ');
            if (!toNickname || !msgText) return alert('Usage: /msg nickname message');
            fetch(`http://localhost:5000/api/channels/${channel?._id}/users`)
                .then(res => res.json())
                .then(users => {
                    if (!users.includes(toNickname)) {
                        setMessages((prev) => ({
                            ...prev,
                            [channel?._id]: [...(prev[channel?._id] || []), { system: true, text: `Utilisateur "${toNickname}" non trouvé dans ce channel.` }]
                        }));
                        return;
                    }
                    // Envoie le message privé via socket
                    socket.emit('sendPrivateMessage', {
                        userId: storedUserId,
                        username: storedUsername,
                        toUsername: toNickname,
                        text: msgText,
                    });
                    // Ne pas ajouter de setMessages ici pour éviter les doublons
                });
            setMessage('');
            return;
        }
        if (message.startsWith('/list')) {
            const parts = message.split(' ');
            const filter = parts[1] || '';
            fetch(`http://localhost:5000/api/channels${filter ? `?name=${filter}` : ''}`)
                .then(res => res.json())
                .then(data => {
                    const targetChannelId = channel?._id || tempChannelId;
                    setMessages((prev) => ({
                        ...prev,
                        [targetChannelId]: [...(prev[targetChannelId] || []), { system: true, text: `Channels disponibles : ${data.map(c => c.name).join(', ')}` }]
                    }));
                });
            setMessage('');
            return;
        }
        if (message.startsWith('/users')) {
            if (!channel || !channel._id) return;
            fetch(`http://localhost:5000/api/channels/${channel._id}/users`)
                .then(res => res.json())
                .then(data => {
                    setMessages((prev) => ({
                        ...prev,
                        [channel._id]: [...(prev[channel._id] || []), { system: true, text: `Utilisateurs dans ce channel : ${data.join(', ')}` }]
                    }));
                });
            setMessage('');
            return;
        }
        if (message.startsWith('/delete ')) {
            const channelName = message.split(' ')[1];
            if (!channelName) return alert('Veuillez spécifier un nom de canal à supprimer.');
            const token = localStorage.getItem('token');
            fetch(`http://localhost:5000/api/channels`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: channelName }),
            })
                .then(res => res.json())
                .then(data => {
                    const targetChannelId = channel?._id || tempChannelId;
                    setMessages((prev) => ({
                        ...prev,
                        [targetChannelId]: [...(prev[targetChannelId] || []), { system: true, text: data.message || 'Canal supprimé.' }]
                    }));
                    if (fetchChannels) fetchChannels();
                });
            setMessage('');
            return;
        }
        if (!channel || !channel._id) {
            // Permettre les commandes même sans canal sélectionné
            if (message.startsWith('/create') || message.startsWith('/list') || message.startsWith('/msg')) {
                // Ces commandes peuvent être exécutées sans canal
            } else {
                setMessages((prev) => ({
                    ...prev,
                    [tempChannelId]: [...(prev[tempChannelId] || []), { system: true, text: 'Veuillez créer ou sélectionner un channel pour envoyer des messages.' }]
                }));
                setMessage('');
                return;
            }
        }
        // Message normal au channel (optimistic update supprimé pour éviter le doublon)
        socket.emit('sendMessage', {
            userId: storedUserId,
            username: storedUsername,
            channelId: channel._id,
            text: message.trim(),
        });
        setMessage('');
    };

    // Création de channel
    const createChannel = async (channelName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/channels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: channelName, creator: storedUsername }),
            });
            const data = await response.json();
            const targetChannelId = channel?._id || tempChannelId;
            if (response.ok) {
                setMessages((prev) => ({
                    ...prev,
                    [targetChannelId]: [...(prev[targetChannelId] || []), { system: true, text: `Channel "${channelName}" créé !` }]
                }));
                setChannels((prev) => [...prev, data]);
                if (fetchChannels) fetchChannels();
            } else {
                setMessages((prev) => ({
                    ...prev,
                    [targetChannelId]: [...(prev[targetChannelId] || []), { system: true, text: data.message || 'Erreur lors de la création du canal.' }]
                }));
            }
        } catch (err) {
            const targetChannelId = channel?._id || tempChannelId;
            setMessages((prev) => ({
                ...prev,
                [targetChannelId]: [...(prev[targetChannelId] || []), { system: true, text: 'Erreur lors de la création du canal (réseau).' }]
            }));
        }
        setMessage('');
    };

    // Gestion de la touche "Entrée"
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="chat-box">
            {channel && channel.name ? (
                <>
                    <div className="channel-header">
                        {channel.name}
                    </div>
                    <div className="message-area">
                        {currentMessages.map((msg, index) => (
                            <div key={index} className={`message${msg.system ? ' system' : ''}${msg.private ? ' private' : ''}`}>
                                <p className="message-meta">
                                    {msg.system ? '[SYSTÈME]' : msg.private ? 
                                        (msg.isFromMe ? 
                                            `[PRIVÉ → ${msg.otherUser}]` : 
                                            `[PRIVÉ ← ${msg.otherUser}]`) : 
                                        (msg.userId === storedUserId || msg.username === storedUsername ? 'Vous' : msg.username)
                                    } {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                                </p>
                                <p>{msg.text}</p>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </>
            ) : (
                <div className="no-channel-message">
                    Sélectionnez un canal pour commencer à discuter
                </div>
            )}
            <div className="input-area">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={channel && channel.name ? 
                        "Tapez votre message, /create [nom] ou /msg [pseudo] [message]..." : 
                        "Tapez /create [nom] pour créer un canal ou /list pour voir les canaux disponibles..."
                    }
                />
                <button onClick={handleSendMessage}>Envoyer</button>
            </div>
        </div>
    );
};

export default ChatComponent;