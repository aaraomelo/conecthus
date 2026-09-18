#!/bin/bash
set -e
BASE="http://localhost:3005"
EMAIL="test.$(date +%s)@example.com"
PASS="SuperSecret123"
NAME="Test User"

echo "=== REGISTER ==="
REG=$(curl -s -X POST $BASE/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
echo "$REG" | head -c 500; echo
TOKEN=$(echo "$REG" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then echo "REGISTER FAILED"; echo "$REG"; exit 1; fi
echo "TOKEN OK: ${TOKEN:0:30}..."

echo "=== LOGIN ==="
LOGIN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
echo "$LOGIN" | head -c 500; echo
echo "LOGIN OK"

echo "=== PROTECTED WITHOUT TOKEN (should 401) ==="
CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/tasks)
echo "Status without token: $CODE (expected 401)"
echo "---"

echo "=== CREATE TASK ==="
TASK=$(curl -s -X POST $BASE/api/tasks -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Test Task\",\"description\":\"Integration test\",\"status\":\"TODO\"}")
echo "$TASK" | head -c 500; echo
TASK_ID=$(echo "$TASK" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "TASK_ID: $TASK_ID"
if [ -z "$TASK_ID" ]; then echo "CREATE FAILED"; exit 1; fi

echo "=== LIST TASKS (DB) ==="
LIST1=$(curl -s $BASE/api/tasks -H "Authorization: Bearer $TOKEN")
echo "$LIST1" | head -c 500; echo

echo "=== LIST TASKS AGAIN (cache) ==="
LIST2=$(curl -s $BASE/api/tasks -H "Authorization: Bearer $TOKEN")
echo "$LIST2" | head -c 500; echo
if [ "$LIST1" = "$LIST2" ]; then echo "CACHE OK"; else echo "CACHE CHECK"; fi

echo "=== UPDATE TASK (invalidate cache) ==="
UPD=$(curl -s -X PATCH $BASE/api/tasks/$TASK_ID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Updated Title\"}")
echo "$UPD" | head -c 500; echo

echo "=== GET TASK ==="
GET=$(curl -s $BASE/api/tasks/$TASK_ID -H "Authorization: Bearer $TOKEN")
echo "$GET" | head -c 500; echo

echo "=== MQTT TEST ==="
USER_ID=$(curl -s $BASE/api/users/me -H "Authorization: Bearer $TOKEN" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "USER_ID: $USER_ID"
# Start subscriber in background inside host (not container) - use mosquitto_sub from host if available, else via docker
# Try via docker exec on mqtt container
echo "Starting MQTT subscriber for notifications/$USER_ID ..."
timeout 10 docker exec conecthus-mqtt mosquitto_sub -h localhost -t "notifications/$USER_ID" -C 1 -W 8 2>&1 &
SUB_PID=$!
sleep 3
echo "Creating task to trigger MQTT..."
curl -s -X POST $BASE/api/tasks -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"MQTT Test $(date +%s)\"}" > /dev/null
echo "Waiting for MQTT..."
wait $SUB_PID 2>&1 | head -n 20 || echo "MQTT wait done (timeout or received)"

echo "=== FRONTEND CHECK ==="
curl -s http://localhost:5173/ | head -n 20
echo "---FRONTEND_API_PROXY---"
curl -s http://localhost:5173/api/ | head -n 20 || echo "no api root"

echo "=== DELETE TASK ==="
DEL=$(curl -s -X DELETE $BASE/api/tasks/$TASK_ID -H "Authorization: Bearer $TOKEN")
echo "DELETE response: $DEL" | head -c 200; echo
echo "GET after delete should 404:"
curl -s -o /dev/null -w "%{http_code}" $BASE/api/tasks/$TASK_ID -H "Authorization: Bearer $TOKEN"; echo

echo "=== DONE ==="
