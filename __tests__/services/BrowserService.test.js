// __tests__/services/BrowserService.test.js

// ----------------------------------------------------
// Mock do Puppeteer para isolar o BrowserService
// ----------------------------------------------------
const puppeteer = require('puppeteer');

// Mocka o módulo 'puppeteer'
jest.mock('puppeteer', () => ({
    launch: jest.fn(() => ({ // Retorna um objeto mockado com a função close
        close: jest.fn(),
        // Você pode adicionar outros métodos do navegador aqui se seu serviço os usar
        // Ex: newPage: jest.fn().mockResolvedValue({ url: jest.fn().mockResolvedValue('http://mockurl.com') })
    })),
}));

// ----------------------------------------------------
// Importa o serviço que queremos testar (caminho corrigido)
// ----------------------------------------------------
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

        // Reseta a instância interna do BrowserService para garantir um estado limpo
        BrowserService.browserInstance = null;
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    // Teste 1: `getBrowser` deve lançar o navegador na primeira chamada
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

    // Teste 2: `getBrowser` deve retornar a instância existente em chamadas subsequentes
    test('getBrowser deve retornar a instância do navegador existente em chamadas subsequentes', async () => {
        await BrowserService.getBrowser(); // Primeira chamada
        const browser2 = await BrowserService.getBrowser(); // Segunda chamada

        expect(puppeteer.launch).toHaveBeenCalledTimes(1); // Continua sendo 1
        expect(browser2).toBe(mockBrowserInstance);
    });

    // Teste 3: `getBrowser` deve lançar um erro se `puppeteer.launch` falhar
    test('getBrowser deve lançar um erro se puppeteer.launch falhar', async () => {
        const launchError = new Error('Erro simulado ao lançar o navegador');
        puppeteer.launch.mockRejectedValue(launchError);

        await expect(BrowserService.getBrowser()).rejects.toThrow('Failed to launch browser. Check Puppeteer installation and system dependencies.');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error launching Puppeteer browser:', launchError);
        expect(BrowserService.browserInstance).toBeNull();
    });

    // Teste 4: `closeBrowser` deve fechar o navegador e resetar a instância
    test('closeBrowser deve fechar o navegador e resetar browserInstance', async () => {
        const browser = await BrowserService.getBrowser();
        expect(BrowserService.browserInstance).toBe(mockBrowserInstance);

        await BrowserService.closeBrowser(browser);

        expect(mockCloseFunction).toHaveBeenCalledTimes(1);
        expect(BrowserService.browserInstance).toBeNull();
        expect(consoleLogSpy).toHaveBeenCalledWith('Puppeteer browser closed.');
    });

    // Teste 5: `closeBrowser` não deve fazer nada se nenhum navegador for fornecido
    test('closeBrowser não deve fazer nada se nenhum navegador for fornecido', async () => {
        await BrowserService.closeBrowser(null);
        await BrowserService.closeBrowser(undefined);
        await BrowserService.closeBrowser();

        expect(mockCloseFunction).not.toHaveBeenCalled();
        expect(consoleLogSpy).not.toHaveBeenCalledWith('Puppeteer browser closed.');
    });
});
