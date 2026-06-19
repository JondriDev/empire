#!/data/data/com.termux/files/usr/bin/bash
# Empire PWA Launcher — opens in standalone Chrome app window
# Looks like a real native app with no address bar

EMPIRE_DIR="$HOME/Desktop/empire"
EMPIRE_URL="http://localhost:3001"
LOG_FILE="$EMPIRE_DIR/logs/pwa-launcher.log"

mkdir -p "$EMPIRE_DIR/logs"

echo "[$(date)] Empire PWA launcher starting..." >> "$LOG_FILE"

# Kill any existing empire server
pkill -f "node server.js" 2>/dev/null
sleep 0.5

# Start the server
cd "$EMPIRE_DIR" || { echo "[$(date)] FAIL — empire dir not found" >> "$LOG_FILE"; exit 1; }
nohup node server.js >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "[$(date)] Server PID: $SERVER_PID" >> "$LOG_FILE"

# Wait for server
for i in $(seq 1 15); do
  if curl -s "$EMPIRE_URL/api/health" > /dev/null 2>&1; then
    echo "[$(date)] Server ready (attempt $i)" >> "$LOG_FILE"
    break
  fi
  sleep 0.5
done

# Open in Chrome app mode (no address bar — looks native)
# This only works if Chrome is installed
if command -v google-chrome-stable &> /dev/null; then
  google-chrome-stable --app="$EMPIRE_URL" --no-first-run --no-default-browser-check >> "$LOG_FILE" 2>&1 &
  echo "[$(date)] Launched Chrome app mode" >> "$LOG_FILE"
elif command -v chromium-browser &> /dev/null; then
  chromium-browser --app="$EMPIRE_URL" --no-first-run >> "$LOG_FILE" 2>&1 &
  echo "[$(date)] Launched Chromium app mode" >> "$LOG_FILE"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$EMPIRE_URL" >> "$LOG_FILE" 2>&1
  echo "[$(date)] Launched via xdg-open" >> "$LOG_FILE"
elif command -v termux-open-url &> /dev/null; then
  termux-open-url "$EMPIRE_URL" >> "$LOG_FILE" 2>&1
  echo "[$(date)] Opened in Android browser" >> "$LOG_FILE"
fi

echo "[$(date)] Empire running at $EMPIRE_URL" >> "$LOG_FILE"