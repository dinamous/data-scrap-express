const express = require('express');
const router = express.Router();

 const { body, validationResult } = require('express-validator');
 const searchController = require('../controllers/searchController');

router.get('/', (req, res) => {
    res.send('Hello Asksuite World!');
});

// POST /search — esqueleto
router.post(
    '/search',
    [
        body('checkin').isISO8601().withMessage('checkin deve ser YYYY-MM-DD'),
        body('checkout').isISO8601().withMessage('checkout deve ser YYYY-MM-DD'),
    ],
    async (req, res, next) => {
        // validação básica
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // delega ao controller
        return searchController.search(req, res, next);
    }
);

module.exports = router;
