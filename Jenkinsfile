pipeline {
    agent any
    
    environment {
        REGISTRY = 'docker.io'
        IMAGE_PREFIX = 'yourdockerhub/taskflow'
        TRIVY_VERSION = '0.50.1'
        GITLEAKS_VERSION = '8.18.2'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Secret Detection') {
            steps {
                script {
                    sh '''
                        docker run --rm -v ${WORKSPACE}:/repo \
                        ghcr.io/gitleaks/gitleaks:v${GITLEAKS_VERSION} \
                        detect --source /repo --report-path /repo/gitleaks-report.json \
                        --verbose --no-git
                    '''
                }
            }
        }
        
        stage('Dependency Scan') {
            parallel {
                stage('npm audit - Client') {
                    steps {
                        dir('client') {
                            sh '''
                                npm ci
                                npm audit --audit-level=high --json > ../npm-audit-client.json || true
                                npm audit --audit-level=high
                            '''
                        }
                    }
                }
                
                stage('npm audit - Server') {
                    steps {
                        dir('server') {
                            sh '''
                                npm ci
                                npm audit --audit-level=high --json > ../npm-audit-server.json || true
                                npm audit --audit-level=high
                            '''
                        }
                    }
                }
                
                stage('Trivy FS - Client') {
                    steps {
                        sh '''
                            docker run --rm -v ${WORKSPACE}:/workspace \
                            aquasec/trivy:${TRIVY_VERSION} fs \
                            --severity CRITICAL,HIGH \
                            --format json \
                            --output /workspace/trivy-fs-client.json \
                            /workspace/client
                        '''
                    }
                }
                
                stage('Trivy FS - Server') {
                    steps {
                        sh '''
                            docker run --rm -v ${WORKSPACE}:/workspace \
                            aquasec/trivy:${TRIVY_VERSION} fs \
                            --severity CRITICAL,HIGH \
                            --format json \
                            --output /workspace/trivy-fs-server.json \
                            /workspace/server
                        '''
                    }
                }
            }
        }
        
        stage('SAST - Semgrep') {
            steps {
                sh '''
                    docker run --rm -v ${WORKSPACE}:/src \
                    returntocorp/semgrep semgrep scan \
                    --config=p/javascript --config=p/react --config=p/nodejs \
                    --config=p/security-audit \
                    --json --output=/src/semgrep-results.json \
                    /src/client/src /src/server/src
                '''
            }
        }
        
        stage('Unit Tests') {
            parallel {
                stage('Server Tests') {
                    steps {
                        dir('server') {
                            sh 'npm test'
                        }
                    }
                }
                
                stage('Client Tests') {
                    steps {
                        dir('client') {
                            sh 'npm test'
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Client') {
                    steps {
                        script {
                            sh '''
                                docker build -t taskflow-client:${GIT_COMMIT} \
                                -t taskflow-client:latest \
                                ./client
                            '''
                        }
                    }
                }
                
                stage('Build Server') {
                    steps {
                        script {
                            sh '''
                                docker build -t taskflow-server:${GIT_COMMIT} \
                                -t taskflow-server:latest \
                                ./server
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Container Image Scan') {
            parallel {
                stage('Scan Client Image') {
                    steps {
                        sh '''
                            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:${TRIVY_VERSION} image \
                            --severity CRITICAL,HIGH \
                            --format json \
                            --output trivy-image-client.json \
                            taskflow-client:${GIT_COMMIT}
                        '''
                    }
                }
                
                stage('Scan Server Image') {
                    steps {
                        sh '''
                            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:${TRIVY_VERSION} image \
                            --severity CRITICAL,HIGH \
                            --format json \
                            --output trivy-image-server.json \
                            taskflow-server:${GIT_COMMIT}
                        '''
                    }
                }
            }
        }
        
        stage('SBOM Generation') {
            parallel {
                stage('SBOM - Client') {
                    steps {
                        sh '''
                            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:${TRIVY_VERSION} image \
                            --format cyclonedx \
                            --output sbom-client.json \
                            taskflow-client:${GIT_COMMIT}
                        '''
                    }
                }
                
                stage('SBOM - Server') {
                    steps {
                        sh '''
                            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:${TRIVY_VERSION} image \
                            --format cyclonedx \
                            --output sbom-server.json \
                            taskflow-server:${GIT_COMMIT}
                        '''
                    }
                }
            }
        }
        
        stage('Security Gate') {
            steps {
                script {
                    // Parse Trivy image scan results and fail if CRITICAL found
                    def clientScan = readJSON file: 'trivy-image-client.json'
                    def serverScan = readJSON file: 'trivy-image-server.json'
                    
                    def criticalCount = 0
                    
                    clientScan.Results?.each { result ->
                        result.Vulnerabilities?.each { vuln ->
                            if (vuln.Severity == 'CRITICAL') {
                                criticalCount++
                            }
                        }
                    }
                    
                    serverScan.Results?.each { result ->
                        result.Vulnerabilities?.each { vuln ->
                            if (vuln.Severity == 'CRITICAL') {
                                criticalCount++
                            }
                        }
                    }
                    
                    if (criticalCount > 0) {
                        error("Security Gate Failed: ${criticalCount} CRITICAL vulnerabilities found")
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', 
                                                   usernameVariable: 'DOCKER_USER', 
                                                   passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        
                        docker tag taskflow-client:${GIT_COMMIT} ${REGISTRY}/${IMAGE_PREFIX}-client:${GIT_COMMIT}
                        docker tag taskflow-client:${GIT_COMMIT} ${REGISTRY}/${IMAGE_PREFIX}-client:latest
                        docker push ${REGISTRY}/${IMAGE_PREFIX}-client:${GIT_COMMIT}
                        docker push ${REGISTRY}/${IMAGE_PREFIX}-client:latest
                        
                        docker tag taskflow-server:${GIT_COMMIT} ${REGISTRY}/${IMAGE_PREFIX}-server:${GIT_COMMIT}
                        docker tag taskflow-server:${GIT_COMMIT} ${REGISTRY}/${IMAGE_PREFIX}-server:latest
                        docker push ${REGISTRY}/${IMAGE_PREFIX}-server:${GIT_COMMIT}
                        docker push ${REGISTRY}/${IMAGE_PREFIX}-server:latest
                    '''
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'database-url', variable: 'DATABASE_URL'),
                    string(credentialsId: 'postgres-password', variable: 'POSTGRES_PASSWORD')
                ]) {
                    sh '''
                        # Create .env file
                        cat > server/.env << EOF
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost
NODE_ENV=production
EOF
                        
                        # Deploy
                        docker compose down -v
                        docker compose up -d
                        
                        # Wait for health
                        sleep 20
                        curl -f http://localhost:5000/api/health || exit 1
                    '''
                }
            }
        }
        
        stage('DAST - OWASP ZAP') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    docker run --rm --network=host \
                    -v ${WORKSPACE}:/zap/wrk:rw \
                    owasp/zap2docker-stable:2.14.0 \
                    zap-baseline.py -t http://localhost -J zap-report.json -r zap-report.html
                '''
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: '''
                gitleaks-report.json,
                npm-audit-*.json,
                trivy-fs-*.json,
                trivy-image-*.json,
                sbom-*.json,
                semgrep-results.json,
                zap-report.*
            ''', allowEmptyArchive: true
            
            junit allowEmptyResults: true, testResults: '**/test-results.xml'
        }
        
        failure {
            emailext (
                subject: "Pipeline Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
