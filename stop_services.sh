#!/bin/bash

echo "🛑 Stopping Coach Grind Services..."

# Kill using saved PIDs if available
if [ -f /root/coach-grind/pids.txt ]; then
    while read pid; do
        kill -9 $pid 2>/dev/null && echo "Stopped process $pid"
    done < /root/coach-grind/pids.txt
    rm /root/coach-grind/pids.txt
fi

# Also kill by port as backup
lsof -ti:8080 | xargs -r kill -9 2>/dev/null
lsof -ti:8002 | xargs -r kill -9 2>/dev/null

echo "✅ Coach Grind services stopped"