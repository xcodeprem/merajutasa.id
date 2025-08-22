# Kubernetes Policies Overview

- Pod Security Standards (PSS) labels applied to `merajutasa` namespace and per-pod annotations enforcing `restricted`.
- NetworkPolicies restrict compliance pods to only accept ingress from API Gateway and Service Mesh.
- Kyverno ClusterPolicy scaffold included for image signature verification. Configure your attestor keys in cluster.
