// Define an empty map for storing remote SSH connection parameters
def remote = [:]

pipeline {

    agent any

    environment {
        user = credentials('agroadvisory_user')
        host = credentials('agroadvisory_host')
        name = credentials('agroadvisory_name')
        ssh_key = credentials('agroadvisory_key')

        // Node.js 22 LTS and pm2 live in the conda environment on prodnodejs01.
        // The OS-level Node.js (/usr/bin/node 18.x, end of life) is being removed,
        // so nothing in this pipeline may rely on the system node/pm2.
        CONDA_ENV_BIN = '/opt/miniforge3/envs/api_env/bin'
        FRONT_DIR     = '/opt/nagroadvisory/front'
        PM2_APP_NAME  = 'agroadvisory'
        FRONT_PORT    = '3000'
    }

    stages {
        stage('Ssh to connect 192.168.199.121 server') {
            steps {
                script {
                    // Set up remote SSH connection parameters
                    remote.allowAnyHosts = true
                    remote.identityFile = ssh_key
                    remote.user = user
                    remote.name = name
                    remote.host = host

                }
            }
        }
        stage('Check conda Node.js and pm2') {
            steps {
                script {
                    sshCommand remote: remote, command: """
                        set -e
                        export PATH=${CONDA_ENV_BIN}:\$PATH
                        test -x ${CONDA_ENV_BIN}/node || { echo "Node.js not found in ${CONDA_ENV_BIN}"; exit 1; }
                        test -x ${CONDA_ENV_BIN}/pm2  || { echo "pm2 not found in ${CONDA_ENV_BIN}"; exit 1; }
                        echo "node: \$(command -v node) \$(node -v)"
                        echo "pm2:  \$(command -v pm2) \$(pm2 -v)"
                    """
                }
            }
        }
        stage('Download latest release') {
            steps {
                script {
                    sshCommand remote: remote, command: """
                        cd /opt/nagroadvisory/front_back/
                        rm -fr front_backup_\$(date +"%Y%m%d")
                        mkdir front_backup_\$(date +"%Y%m%d")
                        cp -r ${FRONT_DIR}/* front_backup_\$(date +"%Y%m%d")
                        rm -fr releaseFront.zip
                        rm -rf build
                        curl -LOk https://github.com/CIAT-DAPA/fertilizer_frontend/releases/latest/download/releaseFront.zip
                        unzip releaseFront.zip -d build
                        rm -r releaseFront.zip
                        cp -r build/* ${FRONT_DIR}/
                        rm -rf build
                    """
                }
            }
        }
        stage('Serve front with pm2 (conda Node.js)') {
            steps {
                script {
                    sshCommand remote: remote, command: """
                        set -e
                        export PATH=${CONDA_ENV_BIN}:\$PATH
                        PM2=${CONDA_ENV_BIN}/pm2
                        PM2_PID_FILE=\${PM2_HOME:-\$HOME/.pm2}/pm2.pid

                        # If a pm2 daemon started with the old system Node.js is still running,
                        # move it (and its saved apps) onto the conda Node.js.
                        if [ -f "\$PM2_PID_FILE" ] && kill -0 "\$(cat \$PM2_PID_FILE)" 2>/dev/null; then
                            DAEMON_NODE=\$(readlink -f /proc/\$(cat \$PM2_PID_FILE)/exe || true)
                            echo "pm2 daemon runs on: \$DAEMON_NODE"
                            case "\$DAEMON_NODE" in
                                ${CONDA_ENV_BIN}/*) ;;
                                *) echo "Moving pm2 daemon to conda Node.js"; \$PM2 update ;;
                            esac
                        fi

                        # Recreate the app so it always runs pm2's static server from the conda
                        # environment (an app created by the old system pm2 points to files under
                        # the system Node.js install, which is being removed).
                        \$PM2 delete ${PM2_APP_NAME} > /dev/null 2>&1 || true
                        \$PM2 serve ${FRONT_DIR} ${FRONT_PORT} --name ${PM2_APP_NAME} --spa
                        \$PM2 save
                        \$PM2 describe ${PM2_APP_NAME} | grep -E "status|node.js version|exec cwd|script args" || true
                    """
                }
            }
        }
    }

    post {
        failure {
            script {
                echo 'fail :c'
            }
        }

        success {
            script {
                echo 'everything went very well!!'
            }
        }
    }

}
