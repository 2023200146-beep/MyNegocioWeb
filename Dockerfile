# Usar Node.js 18 Alpine para mejor rendimiento y seguridad
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (optimización de cache Docker)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto que usa tu aplicación
EXPOSE 3000

# Comando de inicio
CMD [ "node", "inicio.ejs" ]