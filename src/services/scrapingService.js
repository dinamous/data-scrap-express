// src/services/scrapingService.js
const BrowserService = require('./BrowserService');

class ScrapingService {
  async getRooms(checkin, checkout) {
    const browser = await BrowserService.getBrowser();
    let page;

    try {
      page = await browser.newPage();
      await page.setViewport({ width: 1366, height: 768 });

      const url = `https://reservations.fasthotel.me/188/214?entrada=${checkin}&saida=${checkout}&adultos=1#acomodacoes`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('.row.borda-cor', { timeout: 5000 });

      const rooms = await page.evaluate(() => {
        const roomElements = document.querySelectorAll('.row.borda-cor');

        return Array.from(roomElements).map(room => {
          const name = room.querySelector('h3[data-campo="titulo"]')?.innerText.trim() || '';
          const description = room.querySelector('.descricao')?.innerText.trim() || '';

          // Captura o preço corretamente, removendo 'R$' e formatando para número
          const priceText = room.querySelector('b[data-campo="valor"]')?.innerText.trim() || '';
          const price = priceText
            ? parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'))
            : '';

          const imageEl = room.querySelector('.flexslider img');
          const image = imageEl?.getAttribute('src') || '';

          return { name, description, price, image };
        });
      });

      return rooms;
    } catch (error) {
      console.error('ScrapingService error:', error);
      throw error;
    } finally {
      await BrowserService.closeBrowser(browser);
    }
  }
}

module.exports = new ScrapingService();
