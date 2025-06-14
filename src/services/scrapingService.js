// src/services/ScrapingService.js
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

      // --- Cenário 1.1: Mensagem de "Modifique sua busca" (alert-warning) ---
      const modifySearchSelector = '.alert.alert-warning strong.d-block';
      const modifySearchSmallSelector = '.alert.alert-warning small';

      const modifySearchMessage = await page.evaluate((strongSel, smallSel) => {
        const strongEl = document.querySelector(strongSel);
        const smallEl = document.querySelector(smallSel);
        if (strongEl && strongEl.innerText.trim() === 'Modifique sua busca' &&
          smallEl && smallEl.innerText.trim().includes('está fechado para venda')) {
          return `${strongEl.innerText.trim()}: ${smallEl.innerText.trim()}`;
        }
        return null;
      }, modifySearchSelector, modifySearchSmallSelector);

      if (modifySearchMessage) {
        console.warn(`Specific warning message for closed dates detected: "${modifySearchMessage}".`);
        return { rooms: [], message: modifySearchMessage, type: 'warning' };
      }

      // --- Cenário 1.2: Mensagem de "Resposta não esperada" (alert-danger) ---
      const unexpectedResponseSelector = '.alert.alert-danger strong.d-block';
      const unexpectedResponseSmallSelector = '.alert.alert-danger small';

      const unexpectedResponseMessage = await page.evaluate((strongSel, smallSel) => {
        const strongEl = document.querySelector(strongSel);
        const smallEl = document.querySelector(smallSel);
        if (strongEl && strongEl.innerText.trim() === 'Resposta não esperada' &&
          smallEl && smallEl.innerText.trim().includes('Não há quartos disponíveis para esta seleção de datas')) {
          return `${strongEl.innerText.očtrim()}: ${smallEl.innerText.trim()}`;
        }
        return null;
      }, unexpectedResponseSelector, unexpectedResponseSmallSelector);

      if (unexpectedResponseMessage) {
        console.warn(`Specific error message for invalid dates detected by website: "${unexpectedResponseMessage}".`);
        return { rooms: [], message: unexpectedResponseMessage, type: 'error' };
      }

      // --- Cenário 1.3: Mensagem genérica de "acomodação não encontrada" (h3.aviso.error) ---
      const noAvailabilitySelector = 'h3.aviso.error';
      const noAvailabilityMessage = await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : null;
      }, noAvailabilitySelector);

      if (noAvailabilityMessage && noAvailabilityMessage.includes('Nenhuma acomodação encontrada para o período')) {
        console.warn(`Generic "No rooms found" message detected: "${noAvailabilityMessage}".`);
        return { rooms: [], message: noAvailabilityMessage, type: 'info' };
      }

      // --- Cenário 2: Container principal dos quartos não encontrado (timeout) ---
      try {
        await page.waitForSelector('.row.borda-cor', { timeout: 15000 });
        console.log('Main room container found. Proceeding to scrape.');
      } catch (selectorError) {
        console.warn('Timeout waiting for .row.borda-cor. No rooms might be available for these dates or element selector changed.', selectorError.message);
        return { rooms: [], message: 'Timeout waiting for room container. No rooms might be available or element selector changed.', type: 'error' };
      }

      // Lógica de scraping dos quartos
      const rooms = await page.evaluate(async () => {
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

        const roomElements = document.querySelectorAll('.row.borda-cor');
        let scrapedRooms = await Promise.all(Array.from(roomElements).map(async (room) => {
          const name = room.querySelector('h3[data-campo="titulo"]')?.innerText.trim() || '';
          const description = room.querySelector('.descricao')?.innerText.trim() || '';
          const imageEl = room.querySelector('.flexslider img');
          const image = imageEl?.getAttribute('src') || '';

          const pricesContainer = room.querySelector('div[data-campo="tarifas"]');
          let prices = [];

          if (pricesContainer) {
            const pricesElements = pricesContainer.querySelectorAll('div.row.tarifa');

            prices = await Promise.all(Array.from(pricesElements).map(async (priceElement) => {
              const type = priceElement.querySelector('h4[data-campo="nome"]')?.innerText.trim() || '';

              let valorRaw = null;
              let value = null;

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
                const valorElement = await waitForChildElementContent(priceElement, 'b[data-campo="valor"]', 5000);

                if (valorElement) {
                  valorRaw = valorElement.innerText;
                }
              }

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

        // --- Adição: Filtrar quartos vazios ---
        scrapedRooms = scrapedRooms.filter(room => {
          // Um quarto é considerado válido se tiver um nome
          // e/ou se tiver preços válidos (value > 0 para qualquer preço)
          const hasName = room.name && room.name.trim().length > 0;
          const hasValidPrice = room.prices.some(price => typeof price.value === 'number' && price.value > 0);
          return hasName || hasValidPrice;
        });

        return scrapedRooms;
      });

      // --- Cenário 3: Nenhum quarto scraped mesmo se o container existir ---
      if (!rooms || rooms.length === 0) {
        console.warn('Scraping completed, but no valid rooms were extracted after filtering. The container might be empty or content failed to load.');
        return { rooms: [], message: 'No rooms were extracted from the page or valid rooms found after filtering.', type: 'info' };
      }

      return { rooms: rooms, message: 'Rooms scraped successfully.', type: 'success' };
    } catch (error) {
      console.error('ScrapingService error:', error);
      throw error;
    } finally {
      if (page && !page.isClosed()) {
        await page.close();
      }
      await BrowserService.closeBrowser(browser);
    }
  }
}

module.exports = new ScrapingService();