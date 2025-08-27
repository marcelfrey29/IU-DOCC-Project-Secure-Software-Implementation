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

# Application Namspace
kubectl create namespace social-recipe

# Database for the Social Recipe Service (Backend)
echo "Deploying Backend Database (PostgreSQL)..."
kubectl apply -f postgres.pv.yaml -n social-recipe
kubectl apply -f postgres.pvc.yaml -n social-recipe
envsubst < postgres.statefulset.yaml | kubectl apply -f - -n social-recipe
kubectl apply -f postgres.service.yaml -n social-recipe
echo "Deployed Backend Database (PostgreSQL)."

# Social Recipe Service (Backend)
echo "Deploying Backend Service..."
(cd ../backend; docker build . -t ghcr.io/marcelfrey29/iu-docc-secure-software-development-backend:latest)
kubectl apply -f backend.deployment.yaml -n social-recipe
kubectl rollout restart deployment backend -n social-recipe
kubectl apply -f backend.ingress.yaml -n social-recipe
kubectl apply -f backend.service.yaml -n social-recipe
echo "Deployed Backend Service."

# Web App (Frontend)
echo "Deploying Social Recipe Application..."
(cd ../web-app; docker build . -t ghcr.io/marcelfrey29/iu-docc-secure-software-development-web-app:latest)
kubectl apply -f web-app.deployment.yaml -n social-recipe
kubectl rollout restart deployment web-app -n social-recipe
kubectl apply -f web-app.ingress.yaml -n social-recipe
kubectl apply -f web-app.service.yaml -n social-recipe
echo "Deployed Social Recipe Application."

echo "🚀 Application deployed successfully."
