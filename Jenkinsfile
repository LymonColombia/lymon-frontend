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
    }
  }
}
