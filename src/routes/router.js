// src/routes/router.js
const express = require('express');
const router = express.Router();

const { body, validationResult } = require('express-validator');
const searchController = require('../controllers/searchController');

router.get('/', (req, res) => {
    res.send('Hello Asksuite World!');
});

// POST /search — otimizado com validação completa aqui
router.post(
    '/search',
    [
        // Validação de formato da data
        body('checkin')
            .isISO8601().withMessage('checkin deve ser YYYY-MM-DD')
            .custom((value, { req }) => {
                // Validação de que checkin não é uma data passada em relação à data atual (opcional, mas boa prática)
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Zera hora para comparar apenas a data
                const checkinDate = new Date(value + 'T00:00:00'); // Garante fuso horário neutro para comparação

                if (checkinDate < today) {
                    throw new Error('checkin deve ser uma data futura ou igual a hoje');
                }
                return true;
            }),

        // Validação de formato da data
        body('checkout')
            .isISO8601().withMessage('checkout deve ser YYYY-MM-DD')
            .custom((value, { req }) => {
                const checkinDate = new Date(req.body.checkin + 'T00:00:00'); // Pega a data de checkin validada
                const checkoutDate = new Date(value + 'T00:00:00'); // Garante fuso horário neutro para comparação

                // Validação de que checkout deve ser depois de checkin
                if (checkoutDate <= checkinDate) {
                    throw new Error('checkout deve ser uma data posterior ao checkin');
                }
                return true;
            }),
    ],
    // Middleware para lidar com os resultados da validação
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // Se não houver erros de validação, passa para o próximo middleware (o controller)
        next();
    },
    // Delega ao controller APENAS SE A VALIDAÇÃO PASSAR
    searchController.search
);

module.exports = router;