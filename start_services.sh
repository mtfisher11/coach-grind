#!/bin/bash

echo "🏈 Starting Coach Grind Services..."

# Kill any existing processes on our ports
echo "Cleaning up old processes..."
lsof -ti:8080 | xargs -r kill -9 2>/dev/null
lsof -ti:8002 | xargs -r kill -9 2>/dev/null

# Start backend
echo "Starting backend API on port 8002..."
cd /root/coach-grind/backend
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8002 > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Give backend time to start
sleep 3

# Start frontend
echo "Starting frontend on port 8080..."
cd /root/coach-grind
nohup npm run dev -- --host 0.0.0.0 --port 8080 > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "✅ Coach Grind is running!"
echo "   Frontend: http://localhost:8080 (or domain when configured)"
echo "   Backend API: http://localhost:8002"
echo ""
echo "PIDs saved to /root/coach-grind/pids.txt"
echo "$FRONTEND_PID" > /root/coach-grind/pids.txt
echo "$BACKEND_PID" >> /root/coach-grind/pids.txt

echo ""
echo "To stop services, run: /root/coach-grind/stop_services.sh"