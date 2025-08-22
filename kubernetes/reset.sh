#!/bin/bash

echo "🧹 Cleaning up Kubernetes environment..."

kubectl delete namespace ingress-nginx
kubectl delete namespace authentik
kubectl delete namespace social-recipe

echo "✅ Cleanup completed successfully."