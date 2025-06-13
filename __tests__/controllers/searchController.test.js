const searchController = require('../../src/controllers/searchController');
const scrapingService = require('../../src/services/scrapingService');

jest.mock('../../src/services/scrapingService');

describe('searchController.search', () => {
  const mockReq = { body: { checkin: '2025-06-15', checkout: '2025-06-16' } };
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna 200 e quartos quando scraping for bem-sucedido', async () => {
    scrapingService.getRooms.mockResolvedValue({
      rooms: [{ name: 'Quarto Luxo', prices: [] }],
      message: 'Rooms scraped successfully.',
      type: 'success',
    });

    await searchController.search(mockReq, mockRes, mockNext);

    expect(scrapingService.getRooms).toHaveBeenCalledWith('2025-06-15', '2025-06-16');
    expect(mockRes.json).toHaveBeenCalledWith([{ name: 'Quarto Luxo', prices: [] }]);
  });

  test('retorna 200 e mensagem quando resultado for tipo warning', async () => {
    scrapingService.getRooms.mockResolvedValue({
      rooms: [],
      message: 'Modifique sua busca: Este período está fechado para venda.',
      type: 'warning',
    });

    await searchController.search(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Modifique sua busca: Este período está fechado para venda.',
      rooms: [],
    });
  });

  test('retorna 404 e mensagem quando resultado for tipo error', async () => {
    scrapingService.getRooms.mockResolvedValue({
      rooms: [],
      message: 'Não há quartos disponíveis para esta seleção de datas',
      type: 'error',
    });

    await searchController.search(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Não há quartos disponíveis para esta seleção de datas',
      rooms: [],
    });
  });

  test('chama next com erro se getRooms lançar exceção', async () => {
    const fakeError = new Error('Erro inesperado');
    scrapingService.getRooms.mockRejectedValue(fakeError);

    await searchController.search(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(fakeError);
  });
});