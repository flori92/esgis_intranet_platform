# ── Stage 1 : dépendances de production ──────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copier uniquement les manifestes pour profiter du cache Docker
COPY package.json package-lock.json ./

# Installer uniquement les dépendances nécessaires au runtime du serveur
RUN npm ci --omit=dev --ignore-scripts

# ── Stage 2 : image finale légère ────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Métadonnées
LABEL org.opencontainers.image.title="quiz-api" \
      org.opencontainers.image.description="ESGIS Quiz API – Virtualisation Cloud et Datacenter" \
      org.opencontainers.image.source="https://github.com/flori92/esgis_intranet_platform"

# Variables d'environnement par défaut (surchargées par le ConfigMap/Secret K8s)
ENV NODE_ENV=production \
    PORT=3001

# Copier les node_modules de prod depuis le stage précédent
COPY --from=deps /app/node_modules ./node_modules

# Copier uniquement les fichiers nécessaires au serveur
COPY server.js ./
COPY package.json ./

# Utilisateur non-root pour la sécurité
RUN addgroup -S quizapi && adduser -S quizapi -G quizapi
USER quizapi

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
