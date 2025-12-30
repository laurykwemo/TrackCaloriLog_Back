const User = require('./user.model');
const bcrypt = require('bcrypt');
const deletedUser = require('../deleteduser/deleteduser.model');
const crypto = require('crypto');

const userService = {
    calculAge: (data) => {
        try {
            const today = new Date();
            const userBirthDate = new Date(data.birthDate); 
            let age = today.getFullYear() - userBirthDate.getFullYear();
            const mois = today.getMonth() - userBirthDate.getMonth();
            if(mois < 0 || (mois ===0 && today.getDate() < userBirthDate.getDate())){
                age--;
            }
            return age;
        } catch(error){
            console.error("Erreur lors du calcul de l'age :", error);
        }
    },
    createUser: async (data) =>{
        try{
            if(!data.email || !data.password){
                throw new Error('Email et mot de passe sont oligatoires.'); 
            }

            if (data.password.length < 8) {
                throw new Error("Le mot de passe doit faire au moins 8 caractères");
            }

            //Hashage du mot de passe
            const hashedPassword = await bcrypt.hash(data.password, 8);

            const age = await userService.calculAge(data);
            
            const verificationToken = crypto.randomBytes(32).toString('hex');

            // Bloquer les moins de 13 ans
            if (age < 13) {
                throw new Error("Vous devez avoir au moins 13 ans pour vous inscrire.");
            }
            const newUser = await User.create({
                name: data.name,
                email: data.email,
                password: hashedPassword,
                //Format de date YYYY-MM-DD
                birthDate: data.birthDate,
                sex: data.sex,
                height: data.height,
                weight: data.weight,
                role: data.role || 'user',
                isActive: data.isActive ?? true,
                emailVerificationToken: verificationToken,
                emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // Expire dans 24h
            });
            const userObject = newUser.toObject();
            delete userObject.password; //Supprimes le champ password de l'objet retouné
            
            return userObject;
        }catch(error){
            if (process.env.NODE_ENV !== 'test') {
                console.error("Erreur lors de la création de l'utilisateur :", error);
            }
            if(error.code==11000){
                throw new Error("Cet email est déjà utilisé");
            }
            throw error;
        }
    },
    findByEmail: async (email) => {
        try {
            // .lean() est optionnel mais améliore les performances si tu ne fais que de la lecture
            return await User.findOne({ email: email.toLowerCase() });
        } catch (error) {
            throw new Error("Erreur lors de la recherche de l'utilisateur par email : " + error.message);
        }
    },
    getAllUsers: async () => {
        try {
            const users = await User.find().populate('sex', 'label').select('-password -__v -deletedAt -updatedAt');
            return users;
        } catch (error){
            console.error("Erreur lors de la récupération de tous les users :", error);
            throw error;
        }
    },
    getUser: async (userId) => {
        try {
            const user = await User.findById(userId).populate('sex', 'label').select('-password -__v -deletedAt -updatedAt');
            return user;
        } catch {
            console.error("Erreur lors de la récupération du user :", error);
            throw error;
        }
    },
    editUser: async (userId, userData) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                userData,
                { new: true }
            );
            return updatedUser;
        } catch (error) {   // <-- CORRECTION
            console.error("Erreur lors de la modification :", error);
            throw error;
        }
    },
    deleteUser: async (userId) => {
        try {
            // Récupérer l'utilisateur AVEC le password
            const user = await User.findById(userId).select('+password');
            if (!user) return null;

            // Sauvegarder une copie dans DeletedUser
            await deletedUser.create({
                originalUserId: user._id,
                name: user.name,
                email: user.email,
                password: user.password,      // 👈 on le met explicitement
                birthDate: user.birthDate,
                sex: user.sex,
                height: user.height,
                weight: user.weight,
                role: user.role,
                isActive: user.isActive,
                deletedAt: new Date()
            });

            // Supprimer l'utilisateur
            await User.findByIdAndDelete(userId);

            return user;
        } catch (error) {
            console.error("Erreur lors de la suppression :", error);
            throw error;
        }
    },
    updateStatus: async (userId, isActive) => {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { isActive },
                { new: true }
            );

            return user;
        } catch (error) {
            console.error("Erreur updateStatus :", error);
            throw error;
        }
    }
}

module.exports = userService;