// src/controllers/searchController.js
const scrapingService = require('../services/scrapingService');

exports.search = async (req, res, next) => {
  try {
    const { checkin, checkout } = req.body;

    const result = await scrapingService.getRooms(checkin, checkout);

    // Verifica se há uma mensagem de aviso/erro no resultado
    if (result.message && result.rooms.length === 0) {
      
      let statusCode = 200; 
      if (result.type === 'error') {
        statusCode = 404; 
      } else if (result.type === 'warning') {
        statusCode = 200; 
      }

      return res.status(statusCode).json({
        message: result.message,
        rooms: result.rooms 
      });
    }

    return res.json(result.rooms);
  } catch (error) {
    return next(error);
  }
};