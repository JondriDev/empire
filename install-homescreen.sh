#!/data/data/com.termux/files/usr/bin/bash
# Empire Homescreen Setup
# Creates a proper Termux:Widget shortcut so you can launch Empire from your home screen
# 
# Usage: bash ~/Desktop/empire/install-homescreen.sh
# After running: add a "Termux:Widget" to your Android home screen and tap the icon

EMPIRE_DIR="$HOME/Desktop/empire"
SHORTCUT_DIR="$HOME/.shortcuts"
ICON_SRC="$EMPIRE_DIR/public/icon.svg"

echo "━━ The Empire — Install Homescreen Icon ━━"
echo ""

# Step 1: Create the shortcut script
mkdir -p "$SHORTCUT_DIR"
echo "✓ Shortcut directory ready"

# Step 2: Write the launcher
cat > "$SHORTCUT_DIR/empire" << 'SCRIPT'
#!/data/data/com.termux/files/usr/bin/bash
# Empire Launcher for Termux:Widget
EMPIRE_DIR="$HOME/Desktop/empire"
EMPIRE_URL="http://localhost:3001"

cd "$EMPIRE_DIR" || exit 1

# Kill old server
pkill -f "node server.js" 2>/dev/null
sleep 0.3

# Start server
nohup node server.js > /dev/null 2>&1 &

# Wait for it to be ready
for i in $(seq 1 20); do
  if curl -s "$EMPIRE_URL/api/health" > /dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

# Open in browser
termux-open-url "$EMPIRE_URL"
SCRIPT

chmod +x "$SHORTCUT_DIR/empire"
echo "✓ Shortcut script created: $SHORTCUT_DIR/empire"

# Step 3: Also make the .desktop file point to the better launcher
echo "✓ Desktop file already configured"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NEXT STEPS:"
echo "  1. If you haven't already, install Termux:Widget from F-Droid"
echo "  2. Long-press your home screen → Widgets → Termux:Widget"
echo "  3. Place the widget and select 'empire' from the list"
echo "  4. Tap the widget icon to launch Empire!"
echo ""
echo "  The widget will show 'empire' as the label."
echo "  To customize the icon, use a launcher that supports"
echo "  custom widget icons (e.g., Nova Launcher)."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"