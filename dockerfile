# Dockerfile
# Use a imagem base Puppeteer que já vem com o Chrome e as dependências
FROM ghcr.io/puppeteer/puppeteer:latest

# Define o diretório de trabalho dentro do container
WORKDIR /app

# OBRIGATÓRIO: Mudar para o usuário 'pptruser' antes de copiar/instalar dependências.
# Este usuário tem as permissões corretas no ambiente do container.
USER pptruser 

# Copie package.json e package-lock.json (se houver)
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código da aplicação
COPY . .

# Exponha a porta que o Express está usando (ex: 3000)
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]