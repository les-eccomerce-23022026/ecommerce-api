# Multi-stage Dockerfile para o projeto LES Backend
# Otimizado para produção com build eficiente e imagem leve

# Stage 1: Builder - Instala dependências e compila o código
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro para aproveitar cache do Docker
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Stage 2: Production - Imagem final otimizada
FROM node:18-alpine AS production

# Definir diretório de trabalho
WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código compilado do stage builder
COPY --from=builder /app/dist ./dist

# Copiar arquivos necessários (se houver .env.example ou outros)
COPY --from=builder /app/.env* ./

# Alterar propriedade dos arquivos para o usuário nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expor porta da aplicação
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]

# Stage 3: Development - Para desenvolvimento com hot reload
FROM node:18-alpine AS development

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Comando para desenvolvimento com hot reload
CMD ["npm", "run", "dev"]