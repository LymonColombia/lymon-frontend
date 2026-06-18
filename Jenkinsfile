pipeline {
  agent any
  options { timestamps() }

  environment {
    NODE_ENV = 'test'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Setup Environment') {
      steps {
        sh '''
cat > src/environments/environment.ts << 'EOF'
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  auth: {
    endpoint: '/auth',
  },
  user: {
    endpoint: '/user',
  },
  incidentReport: {
    endpoint: '/incident-reports',
  },
  tenant: {
    endpoint: '/tenant',
  },
  properties: {
    endpoint: '/properties',
  },
  reservations: {
    endpoint: '/reservations',
  },
  units: {
    endpoint: '/units',
  },
  guestAuth: {
    endpoint: '/guest/auth',
  },
  audit: {
    endpoint: '/audit',
  },
  crm: {
    endpoint: '/crm',
    guestsEndpoint: '/guests',
  },
};
EOF
        '''
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Run Tests') {
      steps {
        sh 'pnpm run test:cov:scope'
      }
    }

    stage('SonarQube Scan') {
      steps {
        withSonarQubeEnv('SonarQube') {
          script {
            def scannerHome = tool 'SonarScanner'
            sh "${scannerHome}/bin/sonar-scanner"
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 15, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

stage('E2E Tests') {
  steps {
    withCredentials([
      usernamePassword(credentialsId: 'manager-cred', usernameVariable: 'MANAGER_EMAIL', passwordVariable: 'MANAGER_PASSWORD'),
      usernamePassword(credentialsId: 'testadmin-cred', usernameVariable: 'TEST_ADMIN_USER', passwordVariable: 'TEST_ADMIN_PASSWORD')
    ]) {
      sh '''
        pnpm exec playwright install chromium
        MANAGER_EMAIL=$MANAGER_EMAIL MANAGER_PASSWORD=$MANAGER_PASSWORD \
        TEST_ADMIN_USER=$TEST_ADMIN_USER TEST_ADMIN_PASSWORD=$TEST_ADMIN_PASSWORD \
        pnpm exec playwright test --project chromium
      '''
    }
  }
}

    stage('Build & Publish Docker Image') {
      steps {
        script {
withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
      sh '''
        export DOCKER_HOST=tcp://host.docker.internal:2375
        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
        docker build -t $DOCKER_USER/lymon-frontend:$BUILD_NUMBER .
        docker push $DOCKER_USER/lymon-frontend:$BUILD_NUMBER
        docker tag $DOCKER_USER/lymon-frontend:$BUILD_NUMBER $DOCKER_USER/lymon-frontend:latest
        docker push $DOCKER_USER/lymon-frontend:latest
        docker logout
      '''
    }
        }
      }
    }
  }

  post {
    always {
      publishHTML(target: [
        reportDir: 'coverage/lymon-frontend/lcov-report',
        reportFiles: 'index.html',
        reportName: 'Frontend Coverage',
        keepAll: true,
        allowMissing: true
      ])
      publishHTML(target: [
        reportDir: 'playwright-report',
        reportFiles: 'index.html',
        reportName: 'Playwright Report',
        keepAll: true,
        allowMissing: true
      ])
    }
  }
}