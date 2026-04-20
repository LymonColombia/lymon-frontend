pipeline {
  agent any

  options {
    timestamps()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        dir('lymon-frontend') {
          sh 'corepack prepare pnpm@10.33.0 --activate'
          sh 'pnpm install --frozen-lockfile'
        }
      }
    }

    stage('Run Tests') {
      steps {
        dir('lymon-frontend') {
          sh 'pnpm run test -- --watch=false --coverage'
        }
      }
    }

    stage('SonarQube Scan') {
      steps {
        dir('lymon-frontend') {
          withSonarQubeEnv('SonarQube') {
            script {
              def scannerHome = tool 'SonarScanner'
              sh "${scannerHome}/bin/sonar-scanner"
            }
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }
  }

  post {
    always {
      publishHTML(target: [
        reportDir: 'lymon-frontend/coverage/lymon-frontend',
        reportFiles: 'index.html',
        reportName: 'Frontend Coverage',
        keepAll: true,
        allowMissing: true
      ])
    }
  }
}
