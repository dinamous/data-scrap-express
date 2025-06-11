const BrowserService = require('./BrowserService');

class ScrapingService {
  async getRooms(checkin, checkout) {
    const browser = await BrowserService.getBrowser();
    let page;

    try {
      page = await browser.newPage();
      page.on('console', msg => console.log('PAGE LOG (from browser context):', msg.text()));
      await page.setViewport({ width: 1366, height: 768 });

      const url = `https://reservations3.fasthotel.com.br/188/214?entrada=${checkin}&saida=${checkout}&adultos=1#acomodacoes`;
      console.log(`Navigating to URL: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

      try {
        await page.waitForSelector('.row.borda-cor', { timeout: 15000 });
        console.log('Main room container found. Proceeding to scrape.');
      } catch (selectorError) {
        console.warn('Timeout waiting for .row.borda-cor. No rooms might be available for these dates or element selector changed.');
        return [];
      }

      const rooms = await page.evaluate(async () => {
        // Função auxiliar para esperar por um elemento filho ter um atributo com conteúdo
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

        // Função auxiliar original para esperar por um elemento filho ter innerText com conteúdo (mantida como fallback)
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
        console.log(`Found ${roomElements.length} room elements.`);

        const scrapedRooms = await Promise.all(Array.from(roomElements).map(async (room) => {
          const name = room.querySelector('h3[data-campo="titulo"]')?.innerText.trim() || '';
          const description = room.querySelector('.descricao')?.innerText.trim() || '';
          const imageEl = room.querySelector('.flexslider img');
          const image = imageEl?.getAttribute('src') || '';

          const tarifasContainer = room.querySelector('div[data-campo="tarifas"]');
          let tarifas = [];

          if (tarifasContainer) {
            const tarifasElements = tarifasContainer.querySelectorAll('div.row.tarifa');
            console.log(`Found ${tarifasElements.length} tariff elements for room: ${name}`);

            tarifas = await Promise.all(Array.from(tarifasElements).map(async (tarifa) => {
              const nome = tarifa.querySelector('h4[data-campo="nome"]')?.innerText.trim() || '';

              // --- INSERIR DEBUGGER AQUI ---
              console.log(`DEBUG: Inspecionando tarifa para '${nome}' (quarto: ${name})`);
              // debugger; // Descomente esta linha para pausar a execução no navegador

              let valorRaw = null;
              let valor = null;

              // --- TENTATIVA 1: Pegar o valor do 'data-original-title' do tooltip ---
              const tooltipElement = await waitForChildElementWithAttribute(tarifa, 'span.tarifaDetalhes', 'data-original-title', 10000); // 10s timeout

              if (tooltipElement) {
                const tooltipContent = tooltipElement.getAttribute('data-original-title');
                console.log(`DEBUG: Conteúdo do Tooltip para '${nome}' (quarto: ${name}): '${tooltipContent}'`);

                const dailyValueMatches = tooltipContent.match(/R\$ (\d{1,3}(?:\.\d{3})*,\d{2})/g);

                if (dailyValueMatches && dailyValueMatches.length > 0) {
                  let totalSum = 0;
                  dailyValueMatches.forEach(match => {
                    const valueString = match.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
                    totalSum += parseFloat(valueString);
                  });
                  valorRaw = totalSum.toFixed(2).replace('.', ',');
                  console.log(`DEBUG: Valor Raw (via tooltip soma) para '${nome}' (quarto: ${name}): '${valorRaw}'`);
                } else {
                  console.log(`DEBUG: Não foi possível extrair valores diários do tooltip para '${nome}' (quarto: ${name})`);
                }
              } else {
                console.log(`DEBUG: Timeout ou elemento 'span.tarifaDetalhes' sem 'data-original-title' para '${nome}' (quarto: ${name})`);

                // --- TENTATIVA 2 (Fallback): Pegar o valor do elemento <b> ---
                const valorElement = await waitForChildElementContent(tarifa, 'b[data-campo="valor"]', 5000); // 5s timeout

                if (valorElement) {
                  valorRaw = valorElement.innerText;
                  console.log(`DEBUG: Valor Raw (via b tag fallback) para '${nome}' (quarto: ${name}): '${valorRaw}'`);
                } else {
                  console.log(`DEBUG: Falha total: 'b' tag também falhou para '${nome}' (quarto: ${name})`);
                }
              }

              if (valorRaw && valorRaw.trim().length > 0) {
                const valorLimpo = valorRaw.replace(/[R$\s.]/g, '').replace(',', '.');
                console.log(`DEBUG: Valor Limpo para '${nome}' (quarto: ${name}): '${valorLimpo}'`);
                const parsedValue = parseFloat(valorLimpo);

                if (!isNaN(parsedValue)) {
                  valor = parsedValue;
                } else {
                  console.log(`DEBUG: parseFloat retornou NaN para '${nome}' com valorLimpo: '${valorLimpo}' (quarto: ${name})`);
                }
              } else {
                console.log(`DEBUG: valorRaw para '${nome}' é nulo ou vazio: '${valorRaw}' (quarto: ${name})`);
              }

              return { nome, valor };
            }));
          }

          return { name, description, image, tarifas };
        }));

        return scrapedRooms;
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