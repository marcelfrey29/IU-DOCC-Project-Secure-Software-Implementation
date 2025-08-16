# IU-DOCC-Project-Secure-Software-Implementation

## Prerequisites

- A Kubernetes Cluster (e.g. via Docker Desktop)
- [Helm](https://helm.sh/) 

## Deployment

- Create a copy of the `.env.TEMPLATE` file and name it `.env`
- Add values for the keys in the `.env` file
    - `AUTHENTIK_PG_PASS`: Password for the Authentik PostgreSQL Database (run `openssl rand -base64 36` to generate a value)
    - `AUTHENTIK_SECRET_KEY`: Secret Key for Authentik (run `openssl rand -base64 60` to generate a value)
- Deploy the Application into Kubernetes
    - `cd kubernetes`
    - `./deploy.sh`
- Open the Authentik Setup Page: http://auth-service.localhost/if/flow/initial-setup/ (_This can take a moment because the application needs to be deployed and started. "Connection Reset", 404 and 503 errors are expected. Refresh your browser until you see the Authentic Page._)
    - _The default username is `akadmin`_ (not needed here, just as a reference)
    - Fill out the form (add any valid email e.g. `akadmin@example.com` and select a password for the default user)
    - Click "Continue" (_You should now see the Authentik Dashboard_)


