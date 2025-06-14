const express = require('express');
const { body, validationResult } = require('express-validator');
const ScrapingService = require('../services/scrapingService');
const router = express.Router();

const isValidDateFormat = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Data deve estar no formato YYYY-MM-DD');
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new Error('Data inválida');
    }
    return true;
};

router.post(
    '/search',
    [
        body('checkin')
            .isString().withMessage('checkin deve ser uma string')
            .custom(isValidDateFormat).withMessage('checkin deve ser YYYY-MM-DD')
            .custom((value) => {
                const today = new Date();
                const todayFormatted = today.toISOString().split('T')[0];

                if (value < todayFormatted) {
                    throw new Error('checkin deve ser uma data futura ou igual a hoje');
                }
                return true;
            }),
        body('checkout')
            .isString().withMessage('checkout deve ser uma string')
            .custom(isValidDateFormat).withMessage('checkout deve ser YYYY-MM-DD')
            .custom((checkoutValue, { req }) => {
                const checkinValue = req.body.checkin;

                if (new Date(checkoutValue) <= new Date(checkinValue)) {
                    throw new Error('checkout deve ser uma data posterior ao checkin');
                }
                return true;
            }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { checkin, checkout } = req.body;

        try {
            const result = await ScrapingService.getRooms(checkin, checkout);

            // Mapeia os tipos de retorno do ScrapingService para os códigos de status HTTP
            if (result.type === 'error') {
                return res.status(404).json(result);
            }
            if (result.type === 'warning' || result.type === 'info') {
                return res.status(200).json(result);
            }

            return res.status(200).json(result.rooms);
        } catch (error) {
            console.error('Erro ao processar a busca:', error);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    }
);

module.exports = router;