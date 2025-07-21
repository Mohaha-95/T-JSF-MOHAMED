const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');
const Channel = require('./models/Channel');  // Importation du modèle de canal
const User = require('./models/User'); // Ajout de l'import User

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// Map pour associer les socket IDs aux user IDs
const userSocketMap = new Map();

// ✅ Middleware
app.use(express.json()); // Important pour traiter correctement les JSON
app.use(bodyParser.json()); // Redondant mais ajouté au cas où
app.use(cors());

// ✅ Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/irc', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connecté à MongoDB'))
.catch((err) => console.error('Erreur de connexion à MongoDB:', err));

// ✅ Vérification du bon chargement des routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.send('✅ Serveur en ligne avec Socket.IO et MongoDB');
});

// 📌 Route pour créer un canal
app.post('/api/channels', async (req, res) => {
  const { name, creator } = req.body;  // Le nom du canal et le créateur doivent être fournis dans la requête

  if (!name || !creator) {
    return res.status(400).json({ message: 'Le nom du canal et le créateur sont nécessaires.' });
  }

  try {
    // Vérification si un canal avec ce nom existe déjà
    const existingChannel = await Channel.findOne({ name });
    if (existingChannel) {
      console.log('Tentative de création d\'un channel déjà existant:', name);
      return res.status(400).json({ message: 'Un canal avec ce nom existe déjà.' });
    }

    // Création d'un nouveau canal
    const newChannel = new Channel({
      name,
      creator,
    });

    await newChannel.save();  // Sauvegarde du canal dans la base de données

    res.status(201).json(newChannel);  // Retourne les informations du canal créé
  } catch (error) {
    console.error('Erreur lors de la création du canal:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// === ROUTES REST SUPPLÉMENTAIRES ===

// Lister tous les channels (option de filtre par nom, ou tous si all=1)
app.get('/api/channels', async (req, res) => {
  const { name, all, userId } = req.query;
  try {
    let query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (!all && userId) {
      // Ne retourne que les channels où l'utilisateur est membre ou créateur
      const user = await User.findById(userId);
      if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé.' });
      query.$or = [
        { _id: { $in: user.channels } },
        { creator: user.username }
      ];
    }
    const channels = await Channel.find(query);
    res.status(200).json(channels);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Rejoindre un channel
app.post('/api/channels/join', async (req, res) => {
  const { userId, channelId } = req.body;
  if (!userId || !channelId) return res.status(400).json({ message: 'userId et channelId requis.' });
  try {
    const user = await User.findById(userId);
    const channel = await Channel.findById(channelId);
    if (!user || !channel) return res.status(404).json({ message: 'User ou Channel non trouvé.' });
    // Ajoute le user au channel si pas déjà présent
    if (!channel.users.includes(user.username)) {
      channel.users.push(user.username);
      await channel.save();
    }
    // Ajoute le channel au user si pas déjà présent
    if (!user.channels.includes(channel._id)) {
      user.channels.push(channel._id);
      await user.save();
    }
    res.status(200).json({ message: 'Channel rejoint.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Quitter un channel
app.post('/api/channels/quit', async (req, res) => {
  const { userId, channelId } = req.body;
  if (!userId || !channelId) return res.status(400).json({ message: 'userId et channelId requis.' });
  try {
    const user = await User.findById(userId);
    const channel = await Channel.findById(channelId);
    if (!user || !channel) return res.status(404).json({ message: 'User ou Channel non trouvé.' });
    // Retire le user du channel
    channel.users = channel.users.filter(u => u !== user.username);
    await channel.save();
    // Retire le channel du user
    user.channels = user.channels.filter(cid => cid.toString() !== channel._id.toString());
    await user.save();
    res.status(200).json({ message: 'Channel quitté.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Lister les utilisateurs d'un channel
app.get('/api/channels/:id/users', async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel non trouvé.' });
    res.status(200).json(channel.users);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Supprimer un channel (par son créateur)
app.delete('/api/channels', async (req, res) => {
  const { name } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  if (!name || !token) return res.status(400).json({ message: 'Nom du canal et token requis.' });
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    const channel = await Channel.findOne({ name });
    if (!channel) return res.status(404).json({ message: 'Canal non trouvé.' });
    if (channel.creator !== user.username) return res.status(403).json({ message: 'Seul le créateur peut supprimer ce canal.' });
    await channel.deleteOne();
    res.status(200).json({ message: 'Canal supprimé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// 📌 Gestion des messages en temps réel avec Socket.IO
io.on('connection', (socket) => {
  console.log(`🔌 Utilisateur connecté : ${socket.id}`);
  socket.joinedChannels = new Set();

  // Associe le socket à l'userId à la connexion (reçu du client)
  socket.on('registerUser', (userId) => {
    if (userId) userSocketMap.set(socket.id, userId);
  });

  // Rejoindre un channel (room)
  socket.on('joinChannel', async ({ userId, channelId }) => {
    try {
      const user = await User.findById(userId);
      const channel = await Channel.findById(channelId);
      if (!user || !channel) return;
      
      // Vérifie si l'utilisateur était déjà dans le channel
      let wasAlreadyIn = channel.users.includes(user.username);
      
      // Ajoute le user au channel si pas déjà présent
      if (!wasAlreadyIn) {
        await Channel.findByIdAndUpdate(channelId, {
          $addToSet: { users: user.username }
        });
      }
      if (!user.channels.includes(channel._id)) {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { channels: channel._id }
        });
      }
      
      // Rejoint la room Socket.IO
      socket.join(channelId);
      socket.joinedChannels.add(channelId);
      
      // Message système : user a rejoint (uniquement si ce n'est pas un refresh)
      if (!wasAlreadyIn) {
        const systemMsg = new Message({
          username: 'SYSTEM',
          text: `${user.username} a rejoint le channel.`,
          channel: channelId,
          createdAt: new Date(),
        });
        await systemMsg.save();
        
        // Envoyer le message système à tous les utilisateurs connectés dans ce channel
        const usersInChannel = await User.find({ channels: channelId });
        console.log(`[SYSTEM] Envoi du message de join à ${usersInChannel.length} utilisateurs dans le channel ${channel.name}`);
        
        // Envoyer le message à tous les utilisateurs connectés dans ce channel
        for (const userInChannel of usersInChannel) {
          const userSocketIds = Array.from(userSocketMap.entries())
            .filter(([_, userId]) => userId === userInChannel._id.toString())
            .map(([socketId, _]) => socketId);
          
          for (const socketId of userSocketIds) {
            io.to(socketId).emit('systemMessage', systemMsg);
            console.log(`[SYSTEM] Message envoyé à ${userInChannel.username} (socket: ${socketId})`);
          }
        }
        
        console.log(`${user.username} a rejoint le channel ${channel.name}`);
      }
    } catch (err) {
      console.error('Erreur joinChannel:', err);
    }
  });

  // Quitter un channel (room)
  socket.on('quitChannel', async ({ userId, channelId }) => {
    try {
      const user = await User.findById(userId);
      const channel = await Channel.findById(channelId);
      if (!user || !channel) return;
      
      // Vérifie si l'utilisateur était dans le channel AVANT de le retirer
      const wasIn = channel.users.includes(user.username);
      
      // Message système : user a quitté (uniquement si l'utilisateur était dans le channel)
      if (wasIn) {
        const systemMsg = new Message({
          username: 'SYSTEM',
          text: `${user.username} a quitté le channel.`,
          channel: channelId,
          createdAt: new Date(),
        });
        await systemMsg.save();
        
        // Envoyer le message système à tous les utilisateurs connectés dans ce channel
        // (AVANT de retirer l'utilisateur du channel)
        const usersInChannel = await User.find({ channels: channelId });
        console.log(`[SYSTEM] Envoi du message de quit à ${usersInChannel.length} utilisateurs dans le channel ${channel.name}`);
        
        for (const userInChannel of usersInChannel) {
          const userSocketIds = Array.from(userSocketMap.entries())
            .filter(([_, userId]) => userId === userInChannel._id.toString())
            .map(([socketId, _]) => socketId);
          
          for (const socketId of userSocketIds) {
            io.to(socketId).emit('systemMessage', systemMsg);
            console.log(`[SYSTEM] Message envoyé à ${userInChannel.username} (socket: ${socketId})`);
          }
        }
        
        console.log(`${user.username} a quitté le channel ${channel.name}`);
      }
      
      // Maintenant on retire l'utilisateur du channel
      socket.leave(channelId);
      socket.joinedChannels.delete(channelId);
      await Channel.findByIdAndUpdate(channelId, {
        $pull: { users: user.username }
      });
      // Retire le channel du user
      await User.findByIdAndUpdate(userId, {
        $pull: { channels: channel._id }
      });
    } catch (err) {
      console.error('Erreur quitChannel:', err);
    }
  });

  // Envoyer un message à un channel
  socket.on('sendMessage', async ({ userId, username, channelId, text }) => {
    if (!userId || !username || !channelId || !text.trim()) {
      socket.emit('error', 'Données invalides.');
      return;
    }
    try {
      const newMessage = new Message({
        userId,
        username,
        text: text.trim(),
        channel: channelId,
        createdAt: new Date(),
      });
      await newMessage.save();
      io.to(channelId).emit('newMessage', newMessage);
      console.log(`Message envoyé dans le channel ${channelId} par ${username}`);
    } catch (err) {
      console.error('Erreur sendMessage:', err);
      socket.emit('error', 'Erreur lors de l’envoi du message.');
    }
  });



  // Envoyer un message privé (par username)
  socket.on('sendPrivateMessage', async ({ userId, username, toUsername, text }) => {
    if (!userId || !username || !toUsername || !text.trim()) {
      socket.emit('error', 'Données invalides.');
      return;
    }
    try {
      const toUser = await User.findOne({ username: toUsername });
      if (!toUser) {
        socket.emit('error', 'Destinataire non trouvé.');
        return;
      }
      const newMessage = new Message({
        userId,
        username,
        text: text.trim(),
        to: toUser._id,
        toUsername: toUsername,
        createdAt: new Date(),
      });
      await newMessage.save();
      
      // Créer un message pour l'expéditeur (avec toUsername)
      const senderMessage = {
        ...newMessage.toObject(),
        toUsername: toUsername
      };
      
      // Créer un message pour le destinataire (avec username de l'expéditeur)
      const receiverMessage = {
        ...newMessage.toObject(),
        toUsername: username
      };
      
      // Envoie le message à l'expéditeur
      io.to(socket.id).emit('privateMessage', senderMessage);
      
      // Envoie le message au destinataire si connecté
      const destSocketIds = Array.from(userSocketMap.entries())
        .filter(([_, userId]) => userId === toUser._id.toString())
        .map(([socketId, _]) => socketId);
      destSocketIds.forEach(socketId => {
        io.to(socketId).emit('privateMessage', receiverMessage);
      });
      console.log(`Message privé de ${username} à ${toUsername}`);
    } catch (err) {
      console.error('Erreur sendPrivateMessage:', err);
      socket.emit('error', 'Erreur lors de l’envoi du message privé.');
    }
  });

  // Charger l'historique des messages d'un channel
  socket.on('fetchChannelMessages', async (channelId) => {
    try {
      const messages = await Message.find({ channel: channelId }).sort({ createdAt: 1 });
      socket.emit('loadChannelMessages', messages);
    } catch (err) {
      socket.emit('error', 'Erreur lors du chargement des messages du channel.');
    }
  });

  // Charger l'historique des messages privés
  socket.on('fetchPrivateMessages', async ({ userId, toUserId }) => {
    try {
      const messages = await Message.find({
        $or: [
          { userId, to: toUserId },
          { userId: toUserId, to: userId },
        ],
      }).sort({ createdAt: 1 });
      socket.emit('loadPrivateMessages', messages);
    } catch (err) {
      socket.emit('error', 'Erreur lors du chargement des messages privés.');
    }
  });

  // Nettoie le mapping à la déconnexion
  socket.on('disconnect', () => {
    userSocketMap.delete(socket.id);
    console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
  });
});

// ✅ Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
