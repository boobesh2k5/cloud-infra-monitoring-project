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

        BACKEND_IMAGE   = "${ECR_REGISTRY}/${ECR_REPOSITORY}:backend-${BUILD_NUMBER}"
        FRONTEND_IMAGE  = "${ECR_REGISTRY}/${ECR_REPOSITORY}:frontend-${BUILD_NUMBER}"

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

                sh '''
                    echo "Git commit:"
                    git rev-parse --short HEAD

                    echo "Git branch:"
                    git branch --show-current

                    echo "Project structure:"
                    ls -la
                    ls -la application/backend
                    ls -la application/frontend
                '''
            }
        }

        stage('Validate Source') {
            steps {
                echo 'Validating application source files...'

                sh '''
                    set -e

                    test -f application/backend/Dockerfile
                    test -f application/backend/server.py.postgres

                    test -f application/frontend/Dockerfile
                    test -f application/frontend/nginx.conf
                    test -f application/frontend/index.html

                    echo "Required source files are present."
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

                    echo "Kubernetes manifests passed validation."
                '''
            }
        }

        stage('Build Images') {
            parallel {

                stage('Build Backend') {
                    steps {
                        echo "Building backend image: ${BACKEND_IMAGE}"

                        sh '''
                            docker build \
                              -t ${BACKEND_IMAGE} \
                              -f application/backend/Dockerfile \
                              application/backend

                            docker image inspect ${BACKEND_IMAGE} > /dev/null

                            echo "Backend image built successfully."
                        '''
                    }
                }

                stage('Build Frontend') {
                    steps {
                        echo "Building frontend image: ${FRONTEND_IMAGE}"

                        sh '''
                            docker build \
                              -t ${FRONTEND_IMAGE} \
                              -f application/frontend/Dockerfile \
                              application/frontend

                            docker image inspect ${FRONTEND_IMAGE} > /dev/null

                            echo "Frontend image built successfully."
                        '''
                    }
                }
            }
        }

        stage('Security Scan - Trivy') {
            steps {
                echo 'Scanning container images with Trivy...'

                sh '''
                    set +e

                    echo "Scanning backend..."
                    trivy image \
                      --severity HIGH,CRITICAL \
                      --exit-code 0 \
                      ${BACKEND_IMAGE}

                    BACKEND_SCAN_STATUS=$?

                    echo "Scanning frontend..."
                    trivy image \
                      --severity HIGH,CRITICAL \
                      --exit-code 0 \
                      ${FRONTEND_IMAGE}

                    FRONTEND_SCAN_STATUS=$?

                    echo "Trivy backend status: ${BACKEND_SCAN_STATUS}"
                    echo "Trivy frontend status: ${FRONTEND_SCAN_STATUS}"

                    echo "Security scan completed."
                '''
            }
        }

        stage('AWS Validation') {
            steps {
                echo 'Validating AWS identity and EKS access...'

                sh '''
                    set -e

                    echo "AWS identity:"
                    aws sts get-caller-identity

                    echo "EKS cluster:"
                    aws eks describe-cluster \
                      --region ${AWS_REGION} \
                      --name ${EKS_CLUSTER} \
                      --query 'cluster.name' \
                      --output text

                    echo "EKS nodes:"
                    kubectl get nodes
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                echo 'Authenticating with Amazon ECR...'

                sh '''
                    set -e

                    aws ecr get-login-password \
                      --region ${AWS_REGION} \
                    | docker login \
                      --username AWS \
                      --password-stdin ${ECR_REGISTRY}

                    echo "ECR login successful."
                '''
            }
        }

        stage('Push Images') {
            steps {
                echo 'Pushing images to Amazon ECR...'

                sh '''
                    set -e

                    docker push ${BACKEND_IMAGE}
                    docker push ${FRONTEND_IMAGE}

                    echo "Both images pushed successfully."
                '''
            }
        }

        stage('Deploy to EKS') {
            steps {
                echo 'Deploying new images to EKS...'

                sh '''
                    set -e

                    aws eks update-kubeconfig \
                      --region ${AWS_REGION} \
                      --name ${EKS_CLUSTER}

                    echo "Updating backend..."
                    kubectl set image deployment/${BACKEND_DEPLOYMENT} \
                      backend=${BACKEND_IMAGE}

                    echo "Updating frontend..."
                    kubectl set image deployment/${FRONTEND_DEPLOYMENT} \
                      frontend=${FRONTEND_IMAGE}

                    echo "Deployment images updated."
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

                    echo "Backend rollout successful."
                    echo "Frontend rollout successful."
                '''
            }
        }

        stage('Application Health Verification') {
            steps {
                echo 'Checking application health inside Kubernetes...'

                sh '''
                    set -e

                    echo "Backend deployment:"
                    kubectl get deployment ${BACKEND_DEPLOYMENT}

                    echo "Backend pods:"
                    kubectl get pods \
                      -l app=${BACKEND_DEPLOYMENT} \
                      -o wide

                    echo "Frontend deployment:"
                    kubectl get deployment ${FRONTEND_DEPLOYMENT}

                    echo "Frontend pods:"
                    kubectl get pods \
                      -l app=${FRONTEND_DEPLOYMENT} \
                      -o wide

                    echo "Backend endpoints:"
                    kubectl get endpoints novaluxe-backend

                    echo "Frontend service:"
                    kubectl get svc novaluxe-frontend
                '''
            }
        }

        stage('Monitoring Verification') {
            steps {
                echo 'Verifying Prometheus monitoring integration...'

                sh '''
                    set -e

                    echo "Prometheus target health:"
                    curl -fsS "${PROMETHEUS_URL}/api/v1/query" \
                      --data-urlencode 'query=up{job="novaluxe-backend"}' \
                      | python3 -m json.tool

                    echo "Checking NovaLuxe application metrics:"
                    curl -fsS "${PROMETHEUS_URL}/api/v1/query" \
                      --data-urlencode 'query=novaluxe_http_requests_total' \
                      | python3 -m json.tool

                    echo "Checking EKS Kubernetes metrics:"
                    curl -fsS "${PROMETHEUS_URL}/api/v1/query" \
                      --data-urlencode 'query=kube_pod_info' \
                      | python3 -m json.tool \
                      | head -80

                    echo "Checking Jenkins metrics target:"
                    curl -fsS "${PROMETHEUS_URL}/api/v1/query" \
                      --data-urlencode 'query=up{job="jenkins"}' \
                      | python3 -m json.tool

                    echo "Monitoring verification completed."
                '''
            }
        }

        stage('Deployment Summary') {
            steps {
                sh '''
                    echo "=========================================="
                    echo "        DEPLOYMENT SUMMARY"
                    echo "=========================================="

                    echo "Cluster:"
                    kubectl config current-context

                    echo
                    echo "Nodes:"
                    kubectl get nodes

                    echo
                    echo "Backend:"
                    kubectl get pods -l app=${BACKEND_DEPLOYMENT} -o wide

                    echo
                    echo "Frontend:"
                    kubectl get pods -l app=${FRONTEND_DEPLOYMENT} -o wide

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

                    echo "=========================================="
                    echo "       DEPLOYMENT COMPLETED"
                    echo "=========================================="
                '''
            }
        }
    }

    post {

        success {
            echo '''
==========================================
 CI/CD PIPELINE SUCCESSFUL
==========================================
GitHub → Jenkins → Docker → Trivy → ECR
      → EKS → Prometheus → Grafana
==========================================
'''
        }

        failure {
            echo '''
==========================================
 CI/CD PIPELINE FAILED
==========================================
Check the failed stage above.
==========================================
'''
        }

        always {
            sh '''
                docker logout ${ECR_REGISTRY} || true
            '''

            sh '''
                echo "Jenkins build: ${BUILD_NUMBER}"
                echo "Result: ${currentBuild.currentResult}"
            '''
        }
    }
}
