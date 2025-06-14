## 🏨 Asksuite FastHotel Scraper API
Este projeto implementa uma API RESTful para raspar (scrape) informações de acomodações e preços do site de reservas do FastHotel (um ambiente de demonstração da Asksuite), com base em datas de check-in e check-out fornecidas.

A API é construída com Node.js, Express e Puppeteer, e foi projetada para ser robusta no tratamento de diversos cenários de entrada e respostas do site-alvo.

## ⚙️ Tecnologias Utilizadas
Node.js: Plataforma de execução JavaScript.

Express: Framework web para construir a API.

Puppeteer: Biblioteca que controla o Chrome/Chromium via DevTools Protocol.

express-validator: Middleware para validação de requisições.

Jest: Framework de testes para JavaScript.

## 🧱 Arquitetura do Projeto
```
asks-scraper-api/
├── server.js # Ponto de entrada da aplicação
├── src/
│ ├── routes/
│ │ └── router.js # Define rotas e validações
│ ├── controllers/
│ │ └── searchController.js # Controlador principal da busca
│ ├── services/
│ │ ├── ScrapingService.js # Lógica principal do scraping
│ │ └── BrowserService.js # Gerenciamento do navegador Puppeteer
│ └── tests/ # Testes unitários e de integração
```

## 🚀 Como Rodar o Projeto

✅ Pré-requisitos
Node.js (v14 ou superior)

```npm``` ou ```yarn```

## 🔧 Instalação
```bash
git clone https://github.com/dinamous/data-scrap-express-api.git
cd asks-scraper-api
```
```
npm install
```
ou
```
yarn install
```

## ▶️ Execução
Para uma execução da aplicação direto da máquina, pode-se fazer o uso do script a baixo, porém recomenda-se fazer o uso da aplicação por meio do Docker.

```bash
npm start
```
ou
```
yarn start
```

A aplicação estará disponível em: http://localhost:3000


# 🐳 Rodando com Docker
Você pode rodar esta aplicação usando Docker, que é a forma recomendada para garantir que todas as dependências e configurações de ambiente sejam gerenciadas corretamente.

### 🏗️ Construa a Imagem Docker
Primeiro, você precisa construir a imagem Docker a partir do Dockerfile fornecido. Navegue até a pasta raiz do projeto onde o Dockerfile está localizado e execute:
```
npm run docker-create
```
 Ou, se preferir usar comandos Docker puros:

``` 
docker build -t scrap-docker . 
```

Este comando construirá a imagem e a identificará como scrap-docker.

### 🚀 Execute o Container Docker
Com a imagem construída, você pode iniciar a aplicação em um container Docker. Este comando fará o mapeamento da porta 3000 da sua máquina (host) para a porta 3000 dentro do container:

```
npm run docker
```

 Ou, se preferir usar comandos Docker puros:
 ```
 docker run -p 3000:3000 scrap-docker
 ```
## 🧪 Testes
```bash
npm test

ou
yarn test
```

## 📄 Documentação da API (Swagger UI)
Este projeto inclui uma interface interativa de documentação da API utilizando Swagger UI. Você pode explorar todos os endpoints disponíveis, seus parâmetros, modelos de requisição e as possíveis respostas diretamente no seu navegador.

## Para acessar a documentação:

Certifique-se de que o servidor está rodando (veja a seção "Execução" acima).
Abra seu navegador e navegue para: 

`http://localhost:3000/api-docs`

Nesta interface, você encontrará:

- Detalhamento dos Endpoints: Informações sobre as rotas e os métodos HTTP.
- Modelos de Requisição: Exemplos de como construir o corpo das requisições, com cenários de sucesso e erro.
- Exemplos de Respostas: Visualização das estruturas de dados que a API retorna para diferentes situações (sucesso, validação, avisos, erros).

## 📡 API Endpoints

### POST /search
- Permite buscar acomodações e preços para um período específico.

## 🔸 Requisição
URL: /search

Método: POST

Body (JSON):

```json
{
"checkin": "YYYY-MM-DD",
"checkout": "YYYY-MM-DD"
}
```

### 🔸 Exemplo com curl
```bash
curl -X POST http://localhost:3000/search
-H 'Content-Type: application/json'
-d '{
"checkin": "2025-07-01",
"checkout": "2025-07-03"
}'
```

### ✅ Respostas da API
🔹 200 OK – Sucesso
```json
[
    {
    "name": "STUDIO CASAL",
    "description": "Apartamentos localizados no prédio principal do Resort...",
    "image": "https://s3...jpg",
    "prices": [
        { "type": "Tarifa Flexível", "value": 1092.00 },
        { "type": "Tarifa com Café", "value": 1200.00 }
    ]
    }
]
```

🔸 200 OK – Aviso ou Nenhum Quarto
```json
{
"message": "Nenhuma acomodação encontrada para o período.",
"rooms": []
}
```

🔸 400 Bad Request – Erros de Validação
```json
{
"errors": [
    {
    "type": "field",
    "msg": "checkout deve ser uma data posterior ao checkin",
    "path": "checkout"
    }
]
}
```

🔸 404 Not Found – Erros do Site
```json
{
"message": "Resposta não esperada: Não há quartos disponíveis para esta seleção de datas",
"rooms": []
}
```

🔸 500 Internal Server Error
```json
{
"error": "Um erro inesperado ocorreu no servidor.",
"details": "Mensagem específica em ambiente de desenvolvimento"
}
```

## 🔍 Tratamento de Cenários Específicos
- Validação de entrada (router.js)

- Formato de data (YYYY-MM-DD)

- checkin deve ser hoje ou no futuro

- checkout deve ser após checkin

- Mensagens do site detectadas (ScrapingService.js)

- "Modifique sua busca": datas fechadas

- "Nenhuma acomodação": site sem disponibilidade

- Timeout do seletor: HTML pode ter mudado

- Tratamento de exceções com try/catch em todas as camadas críticas

## 🤝 Contribuição
Contribuições são bem-vindas! Abra uma issue ou envie um pull request com melhorias, correções ou ideias.
