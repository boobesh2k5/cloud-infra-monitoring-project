pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        AWS_REGION      = 'eu-north-1'
        AWS_ACCOUNT_ID  = '363267429195'

        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_REPOSITORY  = 'cloud-infra-monitoring-project'

        EKS_CLUSTER     = 'project2-monitoring'

        BACKEND_DEPLOYMENT  = 'novaluxe-backend'
        FRONTEND_DEPLOYMENT = 'novaluxe-frontend'

        PROMETHEUS_URL = 'http://172.31.30.103:9090'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'

                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/boobesh2k5/cloud-infra-monitoring-project.git'
                    ]]
                ])

                script {
                    env.GIT_SHA = sh(
                        script: 'git rev-parse --short=8 HEAD',
                        returnStdout: true
                    ).trim()

                    env.GIT_BRANCH_NAME = sh(
                        script: 'git branch --show-current || true',
                        returnStdout: true
                    ).trim()

                    env.BACKEND_IMAGE =
                        "${env.ECR_REGISTRY}/${env.ECR_REPOSITORY}:backend-${env.GIT_SHA}"

                    env.FRONTEND_IMAGE =
                        "${env.ECR_REGISTRY}/${env.ECR_REPOSITORY}:frontend-${env.GIT_SHA}"
                }

                sh '''
                    echo "=========================================="
                    echo "SOURCE INFORMATION"
                    echo "=========================================="
                    echo "Commit : ${GIT_SHA}"
                    echo "Branch : ${GIT_BRANCH_NAME}"
                    echo "Build  : ${BUILD_NUMBER}"
                    echo "Backend: ${BACKEND_IMAGE}"
                    echo "Frontend: ${FRONTEND_IMAGE}"
                    echo "=========================================="
                '''
            }
        }

        stage('Validate Source') {
            steps {
                echo 'Validating required source files...'

                sh '''
                    set -e

                    test -f application/backend/Dockerfile
                    test -f application/backend/server.py.postgres
                    test -f application/backend/config.py
                    test -f application/backend/schema.sql
                    test -f application/backend/seed.sql

                    test -f application/frontend/Dockerfile
                    test -f application/frontend/nginx.conf
                    test -f application/frontend/index.html

                    echo "Source validation passed."
                '''
            }
        }

        stage('Validate Kubernetes Manifests') {
            steps {
                echo 'Validating Kubernetes manifests...'

                sh '''
                    set -e

                    kubectl apply \
                        --dry-run=client \
                        -f k8s/backend.yaml

                    if [ -f application/frontend/frontend-deployment.yaml ]; then
                        kubectl apply \
                            --dry-run=client \
                            -f application/frontend/frontend-deployment.yaml
                    fi

                    if [ -f application/frontend/frontend-service.yaml ]; then
                        kubectl apply \
                            --dry-run=client \
                            -f application/frontend/frontend-service.yaml
                    fi

                    echo "Kubernetes manifest validation passed."
                '''
            }
        }

        stage('Build Images') {
            parallel {

                stage('Build Backend') {
                    steps {
                        echo "Building backend: ${BACKEND_IMAGE}"

                        sh '''
                            set -e

                            docker build \
                                -t ${BACKEND_IMAGE} \
                                -f application/backend/Dockerfile \
                                application/backend

                            docker image inspect ${BACKEND_IMAGE} > /dev/null

                            echo "Backend build successful."
                        '''
                    }
                }

                stage('Build Frontend') {
                    steps {
                        echo "Building frontend: ${FRONTEND_IMAGE}"

                        sh '''
                            set -e

                            docker build \
                                -t ${FRONTEND_IMAGE} \
                                -f application/frontend/Dockerfile \
                                application/frontend

                            docker image inspect ${FRONTEND_IMAGE} > /dev/null

                            echo "Frontend build successful."
                        '''
                    }
                }
            }
        }

        stage('Security Scan - Trivy') {
            steps {
                echo 'Running Trivy vulnerability scans...'

                sh '''
                    set -e

                    echo "=========================================="
                    echo "BACKEND SECURITY SCAN"
                    echo "=========================================="

                    trivy image \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        ${BACKEND_IMAGE}

                    echo "=========================================="
                    echo "FRONTEND SECURITY SCAN"
                    echo "=========================================="

                    trivy image \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        ${FRONTEND_IMAGE}

                    echo "Trivy scanning completed."
                    echo "Current mode: REPORT ONLY"
                '''
            }
        }

        stage('AWS & EKS Validation') {
            steps {
                echo 'Validating AWS identity and EKS access...'

                sh '''
                    set -e

                    echo "AWS identity:"
                    aws sts get-caller-identity

                    echo
                    echo "EKS cluster:"
                    aws eks describe-cluster \
                        --region ${AWS_REGION} \
                        --name ${EKS_CLUSTER} \
                        --query 'cluster.name' \
                        --output text

                    echo
                    echo "EKS nodes:"
                    kubectl get nodes
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                echo 'Logging into Amazon ECR...'

                retry(2) {
                    sh '''
                        set -e

                        aws ecr get-login-password \
                            --region ${AWS_REGION} \
                        | docker login \
                            --username AWS \
                            --password-stdin ${ECR_REGISTRY}

                        echo "ECR authentication successful."
                    '''
                }
            }
        }

        stage('Push Images to ECR') {
            steps {
                echo 'Pushing images to Amazon ECR...'

                retry(2) {
                    sh '''
                        set -e

                        docker push ${BACKEND_IMAGE}
                        docker push ${FRONTEND_IMAGE}

                        echo "Images pushed successfully."
                    '''
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                echo 'Deploying application to EKS...'

                sh '''
                    set -e

                    aws eks update-kubeconfig \
                        --region ${AWS_REGION} \
                        --name ${EKS_CLUSTER}

                    echo "Updating backend image..."
                    kubectl set image \
                        deployment/${BACKEND_DEPLOYMENT} \
                        backend=${BACKEND_IMAGE}

                    echo "Updating frontend image..."
                    kubectl set image \
                        deployment/${FRONTEND_DEPLOYMENT} \
                        frontend=${FRONTEND_IMAGE}

                    echo "EKS deployment triggered."
                '''
            }
        }

        stage('Rollout Verification') {
            steps {
                echo 'Waiting for Kubernetes rollouts...'

                sh '''
                    set -e

                    kubectl rollout status \
                        deployment/${BACKEND_DEPLOYMENT} \
                        --timeout=180s

                    kubectl rollout status \
                        deployment/${FRONTEND_DEPLOYMENT} \
                        --timeout=180s

                    echo "Both deployments rolled out successfully."
                '''
            }
        }

        stage('Application Health Check') {
            steps {
                echo 'Running post-deployment application health checks...'

                sh '''
                    set -e

                    echo "Backend deployment:"
                    kubectl get deployment ${BACKEND_DEPLOYMENT}

                    echo
                    echo "Backend pods:"
                    kubectl get pods \
                        -l app=${BACKEND_DEPLOYMENT} \
                        -o wide

                    echo
                    echo "Frontend deployment:"
                    kubectl get deployment ${FRONTEND_DEPLOYMENT}

                    echo
                    echo "Frontend pods:"
                    kubectl get pods \
                        -l app=${FRONTEND_DEPLOYMENT} \
                        -o wide

                    echo
                    echo "Backend service endpoints:"
                    kubectl get endpoints novaluxe-backend

                    echo
                    echo "Frontend service:"
                    kubectl get svc novaluxe-frontend

                    echo
                    echo "Testing backend API from inside the backend pod..."

                    BACKEND_POD=$(kubectl get pods \
                        -l app=${BACKEND_DEPLOYMENT} \
                        -o jsonpath='{.items[0].metadata.name}')

                    kubectl exec "${BACKEND_POD}" -- \
                        python -c "import urllib.request; r=urllib.request.urlopen('http://127.0.0.1:8000/api/products', timeout=10); print('HTTP STATUS:', r.status)"

                    echo
                    echo "Backend API health check passed."
                '''
            }
        }

        stage('Monitoring Verification') {
            steps {
                echo 'Verifying Prometheus monitoring...'

                sh '''
                    set -e

                    echo "=========================================="
                    echo "NOVA LUXE BACKEND TARGET"
                    echo "=========================================="

                    curl -fsS "${PROMETHEUS_URL}/api/v1/query" \
                        --data-urlencode 'query=up{job="novaluxe-backend"}' \
                        | python3 -m json.tool

                    echo
                    echo "=========================================="
                    echo "NOVA LUXE APPLICATION METRICS"
                    echo "=========================================="

                    curl -fsS "${PROMETHEUS_URL}/api/v1/query" \
                        --data-urlencode 'query=novaluxe_http_requests_total' \
                        | python3 -m json.tool

                    echo
                    echo "=========================================="
                    echo "EKS / KUBERNETES METRICS"
                    echo "=========================================="

                    curl -fsS "${PROMETHEUS_URL}/api/v1/query" \
                        --data-urlencode 'query=kube_pod_info' \
                        | python3 -m json.tool \
                        | head -80

                    echo
                    echo "=========================================="
                    echo "JENKINS METRICS TARGET"
                    echo "=========================================="

                    curl -fsS "${PROMETHEUS_URL}/api/v1/query" \
                        --data-urlencode 'query=up{job="jenkins"}' \
                        | python3 -m json.tool

                    echo
                    echo "Prometheus monitoring verification passed."
                '''
            }
        }

        stage('Deployment Summary') {
            steps {
                echo 'Generating deployment summary...'

                sh '''
                    echo
                    echo "=========================================="
                    echo "        DEPLOYMENT SUMMARY"
                    echo "=========================================="

                    echo "Git Commit:"
                    echo "${GIT_SHA}"

                    echo
                    echo "Build Number:"
                    echo "${BUILD_NUMBER}"

                    echo
                    echo "EKS Cluster:"
                    echo "${EKS_CLUSTER}"

                    echo
                    echo "Nodes:"
                    kubectl get nodes

                    echo
                    echo "Backend:"
                    kubectl get pods \
                        -l app=${BACKEND_DEPLOYMENT} \
                        -o wide

                    echo
                    echo "Frontend:"
                    kubectl get pods \
                        -l app=${FRONTEND_DEPLOYMENT} \
                        -o wide

                    echo
                    echo "Backend Image:"
                    kubectl get deployment ${BACKEND_DEPLOYMENT} \
                        -o jsonpath='{.spec.template.spec.containers[0].image}'
                    echo

                    echo
                    echo "Frontend Image:"
                    kubectl get deployment ${FRONTEND_DEPLOYMENT} \
                        -o jsonpath='{.spec.template.spec.containers[0].image}'
                    echo

                    echo
                    echo "Grafana / Prometheus monitoring:"
                    echo "${PROMETHEUS_URL}"

                    echo
                    echo "=========================================="
                    echo "       DEPLOYMENT COMPLETED"
                    echo "=========================================="
                '''
            }
        }
    }

    post {

        success {
            echo """
==========================================
 CI/CD PIPELINE SUCCESSFUL
==========================================
Build      : ${env.BUILD_NUMBER}
Git SHA    : ${env.GIT_SHA}
Backend    : ${env.BACKEND_IMAGE}
Frontend   : ${env.FRONTEND_IMAGE}
Cluster    : ${env.EKS_CLUSTER}

GitHub
  ↓
Jenkins
  ↓
Docker Build
  ↓
Trivy
  ↓
Amazon ECR
  ↓
Amazon EKS
  ↓
Application Health Check
  ↓
Prometheus
  ↓
Grafana
==========================================
"""
        }

        failure {
            echo """
==========================================
 CI/CD PIPELINE FAILED
==========================================
Build   : ${env.BUILD_NUMBER}
Git SHA : ${env.GIT_SHA}

Check the failed stage in the Jenkins console.
==========================================
"""
        }

        always {
            sh '''
                docker logout ${ECR_REGISTRY} || true

                docker rmi ${BACKEND_IMAGE} || true
                docker rmi ${FRONTEND_IMAGE} || true
            '''

            echo "Jenkins build: ${env.BUILD_NUMBER}"
            echo "Pipeline result: ${currentBuild.currentResult}"
        }
    }
}
