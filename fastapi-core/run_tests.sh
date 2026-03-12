#!/bin/bash

# Configuration
REPORT_DIR="/home/tra01/project/hanchan/fastapi-core/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${REPORT_DIR}/integration_test_report_${TIMESTAMP}.txt"

mkdir -p "${REPORT_DIR}"

# Activate VENV
source /home/tra01/project/hanchan/fastapi-core/.venv/bin/activate
pip install httpx pytest pytest-asyncio > /dev/null 2>&1

echo "====================================================" > "${REPORT_FILE}"
echo "HANACHAN INTEGRATION TEST REPORT" >> "${REPORT_FILE}"
echo "Date: $(date)" >> "${REPORT_FILE}"
echo "====================================================" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

# Helper function for logging to report file
log() {
    echo "$1" >> "${REPORT_FILE}"
}

# 1. Run Simulation Client and Pytest Suite
log "RUNNING INTEGRATION TESTS WITH SERVER..."

# Kill any existing server on 6200
fuser -k 6200/tcp || true

# Start server in background
cd /home/tra01/project/hanchan/fastapi-core
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 6200 > core.log 2>&1 &
SERVER_PID=$!

# Wait for server
log "Waiting for server to start..."
timeout 30 sh -c 'until curl -s http://127.0.0.1:6200/health > /dev/null; do sleep 1; done'

if [ $? -ne 0 ]; then
    log "Server did not start in time. Aborting tests."
    kill $SERVER_PID
    echo "Server did not start in time. Aborting tests. Report saved to: ${REPORT_FILE}"
    cat "${REPORT_FILE}"
    exit 1
fi

log "Running simulation client..."
.venv/bin/python tests/simulation_client.py >> "${REPORT_FILE}" 2>&1

log "Running integration tests..."
.venv/bin/pytest tests/integration/test_core_integration.py -v >> "${REPORT_FILE}" 2>&1

# Cleanup
log "Cleaning up..."
kill $SERVER_PID
echo "----------------------------------------------------" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

echo "TESTING COMPLETE. Report saved to: ${REPORT_FILE}"
cat "${REPORT_FILE}"
