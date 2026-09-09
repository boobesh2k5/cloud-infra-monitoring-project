pipeline {
    agent any

    environment {
        AWS_REGION = 'eu-north-1'
        ECR_REGISTRY = '363267429195.dkr.ecr.eu-north-1.amazonaws.com'
        ECR_REPOSITORY = 'cloud-infra-monitoring-project'
        BACKEND_IMAGE = "${ECR_REGISTRY}/${ECR_REPOSITORY}:backend-${BUILD_NUMBER}"
        FRONTEND_IMAGE = "${ECR_REGISTRY}/${ECR_REPOSITORY}:frontend-${BUILD_NUMBER}"
        EKS_CLUSTER = 'project2-monitoring'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                sh '''
                    docker build \
                      -t ${BACKEND_IMAGE} \
                      -f application/backend/Dockerfile \
                      application/backend
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    docker build \
                      -t ${FRONTEND_IMAGE} \
                      -f application/frontend/Dockerfile \
                      application/frontend
                '''
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    trivy image --exit-code 0 --severity HIGH,CRITICAL ${BACKEND_IMAGE}
                    trivy image --exit-code 0 --severity HIGH,CRITICAL ${FRONTEND_IMAGE}
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin ${ECR_REGISTRY}
                '''
            }
        }

        stage('Push Images') {
            steps {
                sh '''
                    docker push ${BACKEND_IMAGE}
                    docker push ${FRONTEND_IMAGE}
                '''
            }
        }

        stage('Deploy to EKS') {
            steps {
                sh '''
                    aws eks update-kubeconfig \
                      --region ${AWS_REGION} \
                      --name ${EKS_CLUSTER}

                    kubectl set image deployment/novaluxe-backend \
                      backend=${BACKEND_IMAGE}

                    kubectl set image deployment/novaluxe-frontend \
                      frontend=${FRONTEND_IMAGE}
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    kubectl rollout status deployment/novaluxe-backend --timeout=180s
                    kubectl rollout status deployment/novaluxe-frontend --timeout=180s

                    kubectl get pods -l app=novaluxe-backend
                    kubectl get pods -l app=novaluxe-frontend
                '''
            }
        }
    }

    post {
        always {
            sh 'docker logout ${ECR_REGISTRY} || true'
        }
    }
}
