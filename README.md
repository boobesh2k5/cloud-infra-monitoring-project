<div align="center">

# 🚀 Production-Grade 3-Tier Cloud Infrastructure & Monitoring Platform

### Terraform • AWS VPC • Amazon EKS • RDS PostgreSQL • Jenkins • Amazon ECR • Prometheus • Grafana • Splunk • Fluent Bit

A hands-on AWS DevOps project implementing Infrastructure as Code, 3-tier application deployment, Kubernetes orchestration, CI/CD automation, infrastructure monitoring, and centralized Kubernetes log management.

</div>

---

## 🚀 Project Output

3-tier application (A Ecommerce webpage) is deployed on AWS using Terraform-managed infrastructure. The frontend and backend run on Amazon EKS, PostgreSQL is hosted on Amazon RDS, Jenkins automates application deployment, Prometheus and Grafana provide monitoring, and Fluent Bit forwards EKS container logs to Splunk.

![Deployment Output](./Deployment%20Ouput.png)

---

## ✅ Architecture

```text
                                  GitHub
                                     │
                                     ▼
                                  Jenkins
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                     Docker Build          Trivy Scan
                          │                     │
                          └──────────┬──────────┘
                                     ▼
                                Amazon ECR
                                     │
                                     ▼
                                Amazon EKS
                          ┌──────────┴──────────┐
                          │                     │
                       Frontend              Backend
                        Pod(s)                Pod(s)
                          │                     │
                          └──────────┬──────────┘
                                     │
                                     ▼
                               RDS PostgreSQL
                                 (Private)

  EKS / EC2 Metrics                              EKS Container Logs
          │                                              │
          ▼                                              ▼
     Prometheus                                     Fluent Bit
          │                                              │
          ▼                                              ▼
       Grafana                                      Splunk HEC
                                                         │
                                                         ▼
                                                      Splunk


```
---
```-Tier Architecture Flow


Presentation Tier ──> Frontend (Nginx)
                          │
                          ▼
Application Tier  ──> Backend API
                          │
                          ▼
Data Tier         ──> RDS PostgreSQL

```
---
| Technology                 | Purpose                              |
| :------------------------- | :----------------------------------- |
| **AWS EC2**                | DevOps and monitoring infrastructure |
| **Terraform**              | Infrastructure as Code               |
| **Amazon VPC**             | Cloud networking                     |
| **Public/Private Subnets** | Network segmentation                 |
| **Route Tables**           | Traffic routing                      |
| **NAT Gateway**            | Private subnet outbound connectivity |
| **Security Groups**        | Network access control               |
| **IAM**                    | AWS access control                   |
| **Amazon EKS**             | Managed Kubernetes platform          |
| **Kubernetes**             | Container orchestration              |
| **Amazon RDS PostgreSQL**  | Application database                 |
| **Jenkins**                | CI/CD automation                     |
| **Amazon ECR**             | Container image registry             |
| **Docker**                 | Application containerization         |
| **Trivy**                  | Container vulnerability scanning     |
| **Prometheus**             | Metrics collection                   |
| **Grafana**                | Monitoring dashboards                |
| **Fluent Bit**             | Kubernetes log collection            |
| **Splunk**                 | Centralized log analysis             |

---
## 🔄 Jenkins Pipeline
Images are built, scanned, pushed to Amazon ECR, and deployed to Amazon EKS through Jenkins.
---
# Pipeline Stage view  & Execution
![Pipeline Stage View](./Pipeline%20stage%20view%20for%20cloud%20infra%20project.png)
---
# Pipeline stages
![Pipeline Stages](./Pipeline%20stages%20for%20cloud%20infra%20project.png)
---
Jenkins Monitoring & Dashboard
![Jenkins Dashboard for monitoring](./Jenkins%20Dashboard%20for%20monnitoring.png)
---
Jenkins Centralized Logs
![Jenkins Logs](./Jenkins%20Logs.png)
---

Pipeline Flow
---
Source Checkout
      ->
Source Validation
      ->
K8s Manifest Validation
      ->
Backend + Frontend Build
      ->
Trivy Security Scan
      ->
AWS / EKS Validation
      ->
Amazon ECR Login
      ->
Push Images
      ->
Deploy to EKS
      ->
Rollout Verification
      ->
Application Health Check
      ->
Monitoring Verification
---
## 🐳 Docker Configuration
The microservice application is containerized using multi-stage Docker builds.

# Frontend Dockerfile

### Dockerfile
FROM nginx:alpine

COPY . /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

---

# Backend Dockerfile

### Dockerfile

FROM python:3.12-slim

WORKDIR /app

COPY server.py.postgres ./server.py
COPY config.py .
COPY schema.sql .
COPY seed.sql .

RUN pip install --no-cache-dir "psycopg[binary]" prometheus-client

EXPOSE 8000

CMD ["python", "server.py"]
---
##🛡️ Security
Trivy scans Docker images for vulnerabilities before pushing them to the registry and deploying to production.

Docker Build ──> Trivy Scan ──> Amazon ECR ──> Amazon EKS
Access Control: AWS IAM and Kubernetes RBAC limit access to cluster resources.

Network Isolation: Private subnets, Security Groups, and strictly controlled route tables isolate workloads.
---
## 🏗️ Terraform Infrastructure
terraform/
├── VPC
├── Public Subnets
├── Private Subnets
├── Internet Gateway
├── NAT Gateway
├── Route Tables
├── Security Groups
├── IAM Roles
├── Amazon EKS
├── EKS Worker Nodes
├── Amazon RDS PostgreSQL
└── Bastion / Supporting Resources

Remote State Management
Amazon S3: Remote state storage

AWS DynamoDB: State locking and concurrency control
---

## ☸️ Amazon EKS Architecture
Cluster Name: project2-monitoring

Region: eu-north-1

Kubernetes Version: 1.34

Worker Nodes: 3+

EKS Cluster
├──  Frontend (Frontend Pods)
├──  Backend (Backend Pods)
└── Kube State Metrics (Kubernetes Metrics)

The frontend service is exposed via an AWS Load Balancer, while backend services securely communicate with RDS PostgreSQL inside private subnets.
---
## 🌐 AWS Networking
Custom VPC configuration isolates application tiers across availability zones:


AWS VPC
├── Public Subnets (Internet-facing resources & NAT Gateway)
└── Private Subnets (EKS workloads & Amazon RDS PostgreSQL)

Private Subnets ──> NAT Gateway ──> Internet
VPC Peering connects the monitoring infrastructure to the EKS VPC for metric scraping and log forwarding.

---
## 🗄️ Amazon RDS PostgreSQL
PostgreSQL runs on Amazon RDS inside private subnets as the persistence layer. Access is restricted exclusively to EKS worker node security groups.


Backend ──> RDS PostgreSQL (Private Subnet)
---
## 📊 Prometheus & Grafana Monitoring
Prometheus collects operational metrics across nodes, Kubernetes objects, and applications, exposing data through Grafana dashboards.


EKS / EC2 Nodes
├── Node Exporter
├── Kube State Metrics
└── Application Metrics
          │
          ▼
     Prometheus ──> Grafana
Key Metrics Monitored
EKS node CPU/memory usage

Kubernetes pod states and phases

Deployment replica health

Namespace resource consumption

Service endpoint availability
---

##🔎 Kubernetes Centralized Logging
Fluent Bit runs as a DaemonSet on EKS worker nodes, collecting stdout/stderr container logs and shipping them to Splunk HEC.

---

## Kubernetes Container Logs ──> Fluent Bit ──> Splunk HEC ──> Splunk
### Splunk Search Queries
### Splunk SPL
index=main sourcetype="eks:kubernetes"
### Splunk SPL
index=main earliest=-30m
| stats count by sourcetype source host
| sort - count
---
## 📈 Dashboards & Observability
---
### EKS & Kubernetes Monitoring Dashboard
![EKS-K8S Dashboard for monitoring](./EKS-K8S%20Dashboard%20for%20monitoring.png)
---
### EKS Centralized Logs in Splunk
![EKS-K8S Logs](./EKS-K8S%20Logs.png)
---
## ✅ Validation & Verification
Terraform infrastructure provisioned successfully

VPC with public/private subnets and route tables operational

Amazon EKS cluster deployed and node groups joined

Kubernetes application workloads deployed and running

RDS PostgreSQL connectivity verified from backend pods

Jenkins CI/CD pipeline executing end-to-end builds

Docker images built, scanned via Trivy, and pushed to Amazon ECR

EKS rollout and pod health checks passed

Prometheus metrics scraping active

Grafana monitoring dashboards operational

Fluent Bit forwarding EKS container logs to Splunk

Splunk HEC log ingestion verified

Microservice application accessible end-to-end
---
## 📁 Project Structure

## 📁 Project Structure

```text
cloud-infra-monitoring-project/
├── application/
│   ├── backend/
│   └── frontend/
├── k8s/
│   └── backend.yaml
├── terraform/
│   ├── main.tf
│   ├── outputs.tf
│   └── variables.tf
├── .gitignore
├── Deployment Ouput.png
├── EKS-K8S Dashboard for monitoring.png
├── EKS-K8S Logs.png
├── Jenkins Dashboard for monitoring.png
├── Jenkins Logs.png
├── Jenkinsfile
├── Pipeline stage view for cloud infra project.png
├── Pipeline stages for cloud infra project.png
├── prometheus-config.yaml
└── prometheus-deployment.yaml

```
---
## 👨‍💻 Author

M Boobeshwaran
AWS Cloud & DevOps Engineer Aspirant
AWS • Terraform • Jenkins • Docker • Kubernetes • EKS • ECR • RDS • Prometheus • Grafana • Splunk
