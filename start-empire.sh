#!/data/data/com.termux/files/usr/bin/bash
cd /data/data/com.termux/files/home/Desktop/empire
echo "🏛️  Starting The Empire..."
node server.js &
SERVER_PID=$!
echo "  Server PID: $SERVER_PID"
echo "  Dashboard:  http://localhost:3001"
echo "  API:        http://localhost:3001/api/health"
echo ""
echo "  Press Ctrl+C to stop"
wait $SERVER_PID