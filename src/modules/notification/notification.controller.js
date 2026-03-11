const notificationService = require('./notification.service');

const notificationController = {
    getHistory: async (req, res) => {
        try {
            const history = await notificationService.getAll();
            res.json(history);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    markAsRead: async (req, res) => {
        try {
            const updated = await notificationService.markAsRead(req.params.id);
            if (!updated) return res.status(404).json({ message: "Notification introuvable" });
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    deleteAlert: async (req, res) => {
        try {
            await Notification.findByIdAndDelete(req.params.id);
            res.json({ message: "Alerte supprimée" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = notificationController;