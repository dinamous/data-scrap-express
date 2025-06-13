const puppeteer = require('puppeteer');

jest.mock('puppeteer', () => ({
  launch: jest.fn(() => ({
    close: jest.fn(),
  })),
}));

const BrowserService = require('../../src/services/BrowserService');

describe('BrowserService', () => {
  let mockBrowserInstance;
  let mockCloseFunction;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCloseFunction = jest.fn();
    mockBrowserInstance = {
      close: mockCloseFunction,
    };
    puppeteer.launch.mockResolvedValue(mockBrowserInstance);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    BrowserService.browserInstance = null;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('getBrowser deve lançar o navegador puppeteer na primeira chamada', async () => {
    const browser = await BrowserService.getBrowser();
    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
    expect(puppeteer.launch).toHaveBeenCalledWith({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });
    expect(browser).toBe(mockBrowserInstance);
    expect(BrowserService.browserInstance).toBe(mockBrowserInstance);
    expect(consoleLogSpy).toHaveBeenCalledWith('Launching Puppeteer browser...');
    expect(consoleLogSpy).toHaveBeenCalledWith('Puppeteer browser launched successfully.');
  });

  test('getBrowser deve retornar a instância existente em chamadas subsequentes', async () => {
    await BrowserService.getBrowser();
    const browser2 = await BrowserService.getBrowser();
    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
    expect(browser2).toBe(mockBrowserInstance);
  });

  test('getBrowser deve lançar erro se puppeteer.launch falhar', async () => {
    const launchError = new Error('Erro simulado ao lançar o navegador');
    puppeteer.launch.mockRejectedValue(launchError);
    await expect(BrowserService.getBrowser()).rejects.toThrow('Failed to launch browser. Check Puppeteer installation and system dependencies.');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error launching Puppeteer browser:', launchError);
    expect(BrowserService.browserInstance).toBeNull();
  });

  test('closeBrowser deve fechar o navegador e resetar browserInstance', async () => {
    const browser = await BrowserService.getBrowser();
    expect(BrowserService.browserInstance).toBe(mockBrowserInstance);
    await BrowserService.closeBrowser(browser);
    expect(mockCloseFunction).toHaveBeenCalledTimes(1);
    expect(BrowserService.browserInstance).toBeNull();
    expect(consoleLogSpy).toHaveBeenCalledWith('Puppeteer browser closed.');
  });

  test('closeBrowser não deve fazer nada se nenhum navegador for fornecido', async () => {
    await BrowserService.closeBrowser(null);
    await BrowserService.closeBrowser(undefined);
    await BrowserService.closeBrowser();
    expect(mockCloseFunction).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalledWith('Puppeteer browser closed.');
  });
});