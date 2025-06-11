const BrowserService = require('./BrowserService');

class ScrapingService {
  async getRooms(checkin, checkout) {
    const browser = await BrowserService.getBrowser();
    let page;

    try {
      page = await browser.newPage();
      await page.setViewport({ width: 1366, height: 768 });

      const url = `https://reservations3.fasthotel.com.br/188/214?entrada=${checkin}&saida=${checkout}&adultos=1#acomodacoes`;
      console.log(`Navigating to URL: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      try {
        await page.waitForSelector('.row.borda-cor', { timeout: 15000 });
        console.log('Main room container found. Proceeding to scrape.');
      } catch (selectorError) {
        console.warn('Timeout waiting for .row.borda-cor. No rooms might be available for these dates or element selector changed.');
        return [];
      }

      const rooms = await page.evaluate(async () => {
        // --- FUNÇÕES AUXILIARES DE ESPERA DENTRO DO CONTEXTO DO NAVEGADOR ---
        const waitForChildElementWithAttribute = (parentElement, selector, attributeName, timeout = 10000) => {
          return new Promise((resolve) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
              const el = parentElement.querySelector(selector);
              if (el && el.hasAttribute(attributeName) && el.getAttribute(attributeName).trim().length > 0) {
                clearInterval(interval);
                resolve(el);
              } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                resolve(null);
              }
            }, 100);
          });
        };

        const waitForChildElementContent = (parentElement, selector, timeout = 5000) => {
          return new Promise((resolve) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
              const el = parentElement.querySelector(selector);
              if (el && el.innerText.trim().length > 0) {
                clearInterval(interval);
                resolve(el);
              } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                resolve(null);
              }
            }, 100);
          });
        };

        // --- INÍCIO DA LÓGICA DE SCRAPING ---
        const roomElements = document.querySelectorAll('.row.borda-cor');

        const scrapedRooms = await Promise.all(Array.from(roomElements).map(async (room) => {
          const name = room.querySelector('h3[data-campo="titulo"]')?.innerText.trim() || '';
          const description = room.querySelector('.descricao')?.innerText.trim() || '';
          const imageEl = room.querySelector('.flexslider img');
          const image = imageEl?.getAttribute('src') || '';

          const pricesContainer = room.querySelector('div[data-campo="tarifas"]');
          let prices = [];

          if (pricesContainer) {
            const pricesElements = pricesContainer.querySelectorAll('div.row.tarifa');

            prices = await Promise.all(Array.from(pricesElements).map(async (priceElement) => {
              const type = priceElement.querySelector('h4[data-campo="nome"]')?.innerText.trim() || ''; // Renomeado de nome para type

              let valorRaw = null;
              let value = null; 

              // TENTATIVA 1 (Prioridade): Pegar o valor do 'data-original-title' do tooltip
              const tooltipElement = await waitForChildElementWithAttribute(priceElement, 'span.tarifaDetalhes', 'data-original-title', 10000);

              if (tooltipElement) {
                const tooltipContent = tooltipElement.getAttribute('data-original-title');
                const dailyValueMatches = tooltipContent.match(/R\$ (\d{1,3}(?:\.\d{3})*,\d{2})/g);

                if (dailyValueMatches && dailyValueMatches.length > 0) {
                  let totalSum = 0;
                  dailyValueMatches.forEach(match => {
                    const valueString = match.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
                    totalSum += parseFloat(valueString);
                  });
                  valorRaw = totalSum.toFixed(2).replace('.', ',');
                }
              } else {
                // TENTATIVA 2 (Fallback): Pegar o valor do elemento <b>
                const valorElement = await waitForChildElementContent(priceElement, 'b[data-campo="valor"]', 5000);

                if (valorElement) {
                  valorRaw = valorElement.innerText;
                }
              }

              // Higienizaçao 
              if (valorRaw && valorRaw.trim().length > 0) {
                const valorLimpo = valorRaw.replace(/[R$\s.]/g, '').replace(',', '.');
                const parsedValue = parseFloat(valorLimpo);

                if (!isNaN(parsedValue)) {
                  value = parsedValue;
                }
              }

              return { type, value }; 
            }));
          }

          return { name, description, image, prices }; 
        }));

        return scrapedRooms;
      });

      return rooms;
    } catch (error) {
      console.error('ScrapingService error:', error);
      throw error;
    } finally {
      // Garante que o navegador seja fechado
      await BrowserService.closeBrowser(browser);
    }
  }
}

module.exports = new ScrapingService();