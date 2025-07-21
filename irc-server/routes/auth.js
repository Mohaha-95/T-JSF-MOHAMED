const express = require('express');
const bcrypt = require('bcryptjs'); // Utilisation de bcryptjs
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assurez-vous que ce chemin est correct

const router = express.Router();

// Inscription d'un utilisateur
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    // Vérification des données requises
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Veuillez fournir un nom d\'utilisateur, un email et un mot de passe.' });
    }

    try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer un nouvel utilisateur
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Utilisateur créé avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
    }
});

// Connexion d'un utilisateur
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('Données reçues pour la connexion:', req.body); // Affiche les données envoyées pour la connexion

    // Vérification des données requises
    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe.' });
    }

    try {
        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Mot de passe incorrect.' });
        }

        // Créer un token JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Réponse avec le token, le username et le userId
        res.status(200).json({
            token, // Le token JWT
            message: 'Connexion réussie.',
            userId: user._id, // Ajout de l'userId dans la réponse
            user: {
                username: user.username // On renvoie le username avec le token
            }
        });
    } catch (error) {
        console.error('Erreur dans la connexion :', error); // Affiche les erreurs ici
        res.status(500).json({ message: 'Erreur lors de la connexion.' });
    }
});

// Route pour récupérer les informations utilisateur
router.get('/userinfo', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Récupérer le token du header Authorization

    if (!token) {
        return res.status(401).json({ message: 'Token manquant' }); // Si le token n'est pas fourni
    }

    try {
        // Vérification du token avec la clé secrète
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Recherche de l'utilisateur dans la base de données
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' }); // Si l'utilisateur n'existe pas
        }

        // Répondre avec les données de l'utilisateur
        res.status(200).json({ username: user.username });
    } catch (error) {
        console.error('Erreur lors de la vérification du token :', error);
        res.status(401).json({ message: 'Token invalide ou expiré' }); // Si le token est invalide
    }
});

module.exports = router;
