// src/controllers/searchController.js
// const NodeCache = require('node-cache'); // cache desativado
const scrapingService = require('../services/scrapingService');

// const roomCache = new NodeCache({ stdTTL: 600 }); // cache desativado

exports.search = async (req, res, next) => {
  try {
    // A validação já foi feita na rota, então não precisamos chamar validationResult(req) aqui.
    // Os parâmetros checkin e checkout já estão garantidamente válidos.
    const { checkin, checkout } = req.body;
    // const cacheKey = `${checkin}-${checkout}`; // cache desativado

    // if (roomCache.has(cacheKey)) {
    //   return res.json(roomCache.get(cacheKey));
    // }

    const rooms = await scrapingService.getRooms(checkin, checkout);

    // roomCache.set(cacheKey, rooms); // cache desativado

    return res.json(rooms);
  } catch (error) {
    // Qualquer erro que ocorra no scrapingService será capturado aqui
    // e passado para o próximo middleware de tratamento de erros (se você tiver um).
    return next(error);
  }
};