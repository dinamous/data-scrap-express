const { validationResult } = require('express-validator');
// const NodeCache = require('node-cache'); // cache desativado
const scrapingService = require('../services/scrapingService');

// const roomCache = new NodeCache({ stdTTL: 600 }); // cache desativado

exports.search = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { checkin, checkout } = req.body;
    // const cacheKey = `${checkin}-${checkout}`; // cache desativado

    // if (roomCache.has(cacheKey)) {
    //   return res.json(roomCache.get(cacheKey));
    // }

    const rooms = await scrapingService.getRooms(checkin, checkout);

    // roomCache.set(cacheKey, rooms); // cache desativado

    return res.json(rooms);
  } catch (error) {
    return next(error);
  }
};
