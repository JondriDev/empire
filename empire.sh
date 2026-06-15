#!/data/data/com.termux/files/usr/bin/bash
# Empire Termux Launcher — run from terminal or Android shortcut
# Updated: uses Chromium app mode for a native-app feel

EMPIRE_DIR="$HOME/Desktop/empire"
EMPIRE_URL="http://localhost:3001"

# Start server if not already running
if ! curl -sf "$EMPIRE_URL/api/health" > /dev/null 2>&1; then
  cd "$EMPIRE_DIR" || exit 1
  nohup node server.js > /dev/null 2>&1 &
  for i in $(seq 1 20); do
    if curl -sf "$EMPIRE_URL/api/health" > /dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
fi

# Open in Chromium app mode (no address bar, no tabs)
chromium-browser --app="$EMPIRE_URL" --no-first-run --no-default-browser-check > /dev/null 2>&1 &

echo "Empire is live at $EMPIRE_URL in app mode"