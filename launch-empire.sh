#!/data/data/com.termux/files/usr/bin/bash
# Empire Launcher — one-click start
# Kills any existing empire server, starts a fresh one, and opens the browser
# Optimized for Android/Termux — uses termux-open-url as primary browser opener

EMPIRE_DIR="$HOME/Desktop/empire"
EMPIRE_URL="http://localhost:3001"
LOG_FILE="/dev/null"

mkdir -p "$EMPIRE_DIR/logs"

echo "[$(date)] Starting Empire..." >> "$LOG_FILE"

# Kill any existing empire server
pkill -f "node server.js" 2>/dev/null
sleep 0.5

# Launch server in background
cd "$EMPIRE_DIR" || exit 1
nohup node server.js >> "$EMPIRE_DIR/logs/launcher.log" 2>&1 &
SERVER_PID=$!
echo "[$(date)] Server PID: $SERVER_PID" >> "$LOG_FILE"

# Wait for it to start
for i in $(seq 1 15); do
  if curl -s "$EMPIRE_URL/api/health" > /dev/null 2>&1; then
    echo "[$(date)] Server ready (attempt $i)" >> "$LOG_FILE"
    break
  fi
  sleep 0.5
done

# Open in browser — Android/Termux optimized order
if command -v termux-open-url &> /dev/null; then
  termux-open-url "$EMPIRE_URL" >> "$LOG_FILE" 2>&1
elif command -v xdg-open &> /dev/null; then
  xdg-open "$EMPIRE_URL" >> "$LOG_FILE" 2>&1
else
  echo "[$(date)] No browser launcher found" >> "$LOG_FILE"
fi

echo "[$(date)] Empire launched — $EMPIRE_URL" >> "$LOG_FILE"