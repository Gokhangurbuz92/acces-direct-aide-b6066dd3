FROM python:3.10-slim
WORKDIR /app
# Installation du cœur et du paquet législatif français
RUN pip install --no-cache-dir openfisca-core openfisca-france
EXPOSE 2000
# Lancement du serveur d'API natif d'OpenFisca
CMD ["openfisca", "serve", "--country-package", "openfisca_france", "--port", "2000", "--bind", "0.0.0.0"]
