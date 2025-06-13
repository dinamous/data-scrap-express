jest.mock('dotenv', () => ({ config: jest.fn() }));

const request = require('supertest');
let mockCurrentAppInstance;

jest.mock('express', () => {
  const expressMock = jest.fn(() => mockCurrentAppInstance);
  expressMock.json = jest.fn(() => 'json-middleware');
  expressMock.Router = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  }));
  return expressMock;
});

jest.mock('../src/routes/router.js', () => ({
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('swagger-ui-express', () => ({
  serve: jest.fn(),
  setup: jest.fn(() => 'swagger-handler'),
}));

jest.mock('yamljs', () => ({
  load: jest.fn(() => ({
    swagger: '2.0',
    info: { title: 'Mock API', version: '1.0.0' },
    paths: {},
  })),
}));

describe('Aplicação Express', () => {
  let consoleSpies;

  beforeEach(() => {
    jest.resetModules();

    mockCurrentAppInstance = {
      use: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      listen: jest.fn((port, callback) => {
        if (callback) callback();
        return mockCurrentAppInstance;
      }),
    };

    Object.defineProperty(process, 'env', {
      value: { PORT: '8080' },
      writable: true,
    });

    consoleSpies = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('deve carregar o app sem falhas', () => {
    const app = require('../src/app');
    expect(app).toBeDefined();
  });
});