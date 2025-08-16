#!/bin/bash

echo "⚙️ Deploying Application to Kubernetes..."

# We need to load the .env file and export all variables.
echo "Loading Environment Variabels..."
set -a
source ../.env
set +a
echo "Environment Variables loaded."

# Nginx Ingres Controller
echo "Deploying nginx Ingress Controller..."
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace
echo "Deployed nginx Ingress Controller."

# Wait for the nginx Ingress Controller to be ready
# If the Ingress Controller is not ready, the Authentik deployment will fail.
echo "Waiting for nginx Ingress Controller to be ready..."
sleep 30 

# Authentik as Auth-Service
echo "Deploying Auth Service (Authentik)..."
helm repo add authentik https://charts.goauthentik.io
helm repo update
helm upgrade --install authentik authentik/authentik \
    -f authentik.values.yaml \
    --set authentik.secret_key=$AUTHENTIK_SECRET_KEY \
    --set authentik.postgresql.password=$AUTHENTIK_PG_PASS \
    --set postgresql.auth.password=$AUTHENTIK_PG_PASS \
    --namespace authentik --create-namespace
echo "Deployed Auth Service (Authentik)."

echo "🚀 Application deployed successfully."
