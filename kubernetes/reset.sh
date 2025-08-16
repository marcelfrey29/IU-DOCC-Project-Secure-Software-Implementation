#!/bin/bash

echo "🧹 Cleaning up Kubernetes environment..."

kubectl delete namespace ingress-nginx
kubectl delete namespace authentik

echo "✅ Cleanup completed successfully."