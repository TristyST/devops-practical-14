
# Campus Helpdesk API

A REST API for managing IT support tickets in a university campus environment. The project demonstrates a DevOps workflow using Node.js, Docker, Docker Hub, GitHub Actions, Terraform, and Google Cloud Compute Engine.

## Project Overview

Campus Helpdesk API allows users to create, retrieve, update, and delete IT support tickets.

### Features

- Create new support tickets.
- Retrieve all tickets or a specific ticket by ID.
- Filter tickets by status and priority.
- Update ticket status.
- Delete tickets.
- Persist ticket data in a JSON file.
- Health check endpoint for monitoring.

## Technology Stack

- **Runtime:** Node.js 24
- **Backend:** Express 5
- **Containerization:** Docker
- **Image Registry:** Docker Hub
- **CI/CD:** GitHub Actions
- **Infrastructure as Code:** Terraform
- **Cloud Platform:** Google Cloud Compute Engine
- **Operating System:** Debian 13

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/tickets` | Get all tickets |
| GET | `/api/tickets/:id` | Get a ticket by ID |
| POST | `/api/tickets` | Create a ticket |
| PATCH | `/api/tickets/:id` | Update ticket status |
| DELETE | `/api/tickets/:id` | Delete a ticket |

### Ticket Properties

- `title` — required, maximum 120 characters.
- `description` — required, maximum 2000 characters.
- `category` — ticket category; defaults to `general`.
- `priority` — `low`, `medium`, or `high`.
- `status` — `open`, `in_progress`, or `resolved`.

## Local Development

### Prerequisites

- Node.js 24 or later
- npm

### Installation

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

### Run in production mode

```bash
npm start
```

The API listens on port `3000` by default.

## Testing

Run the automated test suite:

```bash
npm test
```

## Docker

### Build the image

```bash
docker build -t campus-helpdesk-api:1.0 .
```

### Run the container

```bash
docker run -d \
  --name campus-helpdesk-container \
  -p 3001:3000 \
  -v campus-helpdesk-data:/app/src/data \
  campus-helpdesk-api:1.0
```

The named Docker volume preserves ticket data when the container is restarted or replaced.

### Verify the application

```bash
curl http://localhost:3001/health
```

### Stop the container

```bash
docker stop campus-helpdesk-container
docker rm campus-helpdesk-container
```

## Docker Hub

The application image is published to:

[tristyst/campus-helpdesk-api](https://hub.docker.com/r/tristyst/campus-helpdesk-api)

Pull the image:

```bash
docker pull tristyst/campus-helpdesk-api:1.0
```

## Cloud Deployment

The application is deployed to a Google Cloud Compute Engine virtual machine.

| Property | Value |
|---|---|
| VM name | `devops-test` |
| Region | `europe-west1` |
| Zone | `europe-west1-b` |
| Machine type | `e2-medium` |
| Operating system | Debian 13 |
| Container port | `3000` |

The Docker container runs with automatic restart and a persistent Docker volume.

**Cloud provider note:** AWS access was unavailable during the practical assignment. Google Cloud Compute Engine was used as an alternative IaaS platform. The deployment therefore uses a GCE virtual machine rather than an AWS EC2 instance.

## Terraform

Terraform configuration is located in `infra/`.

It describes the existing Google Cloud resources:

- Compute Engine virtual machine.
- Firewall rule allowing TCP traffic on port `3000`.

The existing resources were imported into Terraform state to avoid creating duplicate infrastructure.

Initialize Terraform:

```bash
terraform -chdir=infra init
```

Import the existing VM:

```bash
terraform -chdir=infra import \
  google_compute_instance.devops_test \
  projects/devops-practical-14/zones/europe-west1-b/instances/devops-test
```

Import the existing firewall rule:

```bash
terraform -chdir=infra import \
  google_compute_firewall.campus_helpdesk_api \
  projects/devops-practical-14/global/firewalls/allow-campus-helpdesk-api
```

Review the infrastructure:

```bash
terraform -chdir=infra plan
```

Terraform state files and local provider data are excluded from version control.

## GitHub Secrets

The CI/CD workflow uses GitHub Actions repository secrets. The following secrets are required for the Docker Hub and Google Cloud deployment integration:

| Secret | Purpose |
|---|---|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_TOKEN` | Docker Hub access token |
| `GCE_HOST` | Google Cloud VM external IP |
| `GCE_USER` | SSH username |
| `GCE_SSH_KEY_B64` | Base64-encoded SSH private key |

Never commit credentials, private keys, access tokens, or `.env` files to the repository.

## Project Structure

```text
students/tristyst/
├── .github/
│   └── workflows/
├── infra/
│   ├── main.tf
│   └── .terraform.lock.hcl
├── src/
│   ├── data/
│   │   └── tickets.json
│   ├── server.js
│   └── tickets.js
├── tests/
│   └── tickets.test.js
├── .dockerignore
├── .gitignore
├── Dockerfile
├── package.json
├── package-lock.json
└── README.md
```

## Security and Cost Considerations

- Secrets are stored in GitHub Actions repository settings.
- Terraform state files are excluded from Git.
- The API currently has no authentication and is intended for demonstration purposes, not production use.
- The public firewall rule should be restricted or removed after the demonstration.
- Cloud resources should be destroyed when they are no longer required to avoid unnecessary costs.

## License

MIT
