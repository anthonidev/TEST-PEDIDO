# FROM node:21-alpine3.19

# # Instalar dependencias de compilación necesarias para bcrypt y otras librerías nativas
# RUN apk add --no-cache \
#     build-base \
#     python3 \
#     py3-pip \
#     bash

# # Crear directorio de trabajo y establecer el directorio actual
# WORKDIR /usr/src/app

# # Copiar archivos package.json y package-lock.json
# COPY package.json ./ 
# COPY package-lock.json ./

# # Instalar las dependencias de Node.js
# RUN npm install

# # Copiar el resto de los archivos de la aplicación
# COPY . .

# # Exponer el puerto donde se ejecutará la aplicación
# EXPOSE 3003

FROM node:21-alpine3.19 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.2.0 --activate 
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Etapa de construcción
FROM base AS builder
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store 
COPY . .
RUN pnpm build

# Etapa de producción
FROM base AS runner
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.2.0 --activate 
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod
COPY --from=builder /app/dist ./dist
CMD [ "node", "dist/main" ]
