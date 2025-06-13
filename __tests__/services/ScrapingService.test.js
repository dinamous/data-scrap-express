// __tests__/services/ScrapingService.test.js
jest.mock('../../src/services/BrowserService');
const ScrapingService = require('../../src/services/scrapingService');
const BrowserService = require('../../src/services/BrowserService');

describe('ScrapingService', () => {
  let mockPage;
  let mockBrowser;

  beforeEach(() => {
    mockPage = {
      setViewport: jest.fn(),
      goto: jest.fn(),
      evaluate: jest.fn(),
      waitForSelector: jest.fn(),
      isClosed: jest.fn().mockReturnValue(false),
      close: jest.fn(),
    };
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
    };
    BrowserService.getBrowser.mockResolvedValue(mockBrowser);
    BrowserService.closeBrowser.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar aviso "Modifique sua busca"', async () => {
    mockPage.evaluate.mockImplementationOnce(() =>
      'Modifique sua busca: Este período está fechado para venda'
    );
    const result = await ScrapingService.getRooms('2025-06-15', '2025-06-16');
    expect(result).toEqual({
      rooms: [],
      message: 'Modifique sua busca: Este período está fechado para venda',
      type: 'warning',
    });
  });

  test('deve retornar erro "Resposta não esperada"', async () => {
    mockPage.evaluate
      .mockImplementationOnce(() => null) // skip modifySearchMessage
      .mockImplementationOnce(() =>
        'Resposta não esperada: Não há quartos disponíveis para esta seleção de datas'
      );
    const result = await ScrapingService.getRooms('2025-06-15', '2025-06-16');
    expect(result).toEqual({
      rooms: [],
      message: 'Resposta não esperada: Não há quartos disponíveis para esta seleção de datas',
      type: 'error',
    });
  });

  test('deve retornar mensagem "Nenhuma acomodação encontrada"', async () => {
    mockPage.evaluate
      .mockImplementationOnce(() => null) // modifySearchMessage
      .mockImplementationOnce(() => null) // unexpectedResponseMessage
      .mockImplementationOnce(() => 'Nenhuma acomodação encontrada para o período');
    const result = await ScrapingService.getRooms('2025-06-15', '2025-06-16');
    expect(result).toEqual({
      rooms: [],
      message: 'Nenhuma acomodação encontrada para o período',
      type: 'info',
    });
  });

  test('deve lidar com timeout ao esperar container', async () => {
    mockPage.evaluate
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => null);
    mockPage.waitForSelector.mockRejectedValueOnce(new Error('Timeout'));
    const result = await ScrapingService.getRooms('2025-06-15', '2025-06-16');
    expect(result).toEqual({
      rooms: [],
      message: expect.stringContaining('Timeout waiting for room container'),
      type: 'error',
    });
  });

  test('deve retornar sucesso com quartos raspados', async () => {
    mockPage.evaluate
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => [
        {
          name: 'Quarto Deluxe',
          description: 'Um ótimo quarto',
          image: 'http://imagem.jpg',
          prices: [{ type: 'Tarifa Padrão', value: 299.99 }],
        },
      ]);
    mockPage.waitForSelector.mockResolvedValue();
    const result = await ScrapingService.getRooms('2025-06-15', '2025-06-16');
    expect(result).toEqual({
      rooms: [
        {
          name: 'Quarto Deluxe',
          description: 'Um ótimo quarto',
          image: 'http://imagem.jpg',
          prices: [{ type: 'Tarifa Padrão', value: 299.99 }],
        },
      ],
      message: 'Rooms scraped successfully.',
      type: 'success',
    });
  });

  test('deve retornar info se nenhum quarto for extraído', async () => {
    mockPage.evaluate
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => []);
    mockPage.waitForSelector.mockResolvedValue();
    const result = await ScrapingService.getRooms('2025-06-15', '2025-06-16');
    expect(result).toEqual({
      rooms: [],
      message: 'No rooms were extracted from the page.',
      type: 'info',
    });
  });
});