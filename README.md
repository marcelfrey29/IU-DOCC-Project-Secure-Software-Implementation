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
- Setup Authentik (Auth Service)
    - Open http://auth-service.localhost/ and log-in as admin user (`akadmin`)
    - Go to "Settings" (Gear in the upper right) -> "Tokens and App Passwords"
    - Click "Create Token", add `terraform` as `identifier` and click create
    - Add the token to the `token` field of the `authentik` provider in `terraform/main.tf`
    - Terraform can't resolve `auth-service.localhost` without a host entry, so we need to create one
        - Edit the `/etc/hosts` file and add the following line: `127.0.0.1    auth-service.localhost`
    - Run `terraform init` and `terraform apply`, confirm with `yes`
- _The setup is now complete_ 🥳

