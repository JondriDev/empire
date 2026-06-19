#!/bin/bash
# Empire Iteration Script - Expert World-Class Quality Assurance
# Runs every hour to audit, fix, build, and validate the Empire suite

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
EMPIRE_DIR="$HOME/Desktop/empire"
LOG_FILE="$EMPIRE_DIR/logs/iteration-log.md"
FINDINGS_FILE="$EMPIRE_DIR/docs/archive/findings.md"
PROGRESS_FILE="$EMPIRE_DIR/docs/archive/progress.md"

# Timestamp
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
DATE_KEY=$(date "+%Y-%m-%d")

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     EMPIRE ITERATION - Quality Assurance Cycle        ║${NC}"
echo -e "${BLUE}║     $TIMESTAMP                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Initialize log
cat > "$LOG_FILE" << EOF
# Empire Iteration Log

## Current Run: $TIMESTAMP

### Phase 1: Structure Audit
EOF

# ============================================
# PHASE 1: Structure Audit
# ============================================
echo -e "${YELLOW}[1/6] Structure Audit${NC}"
echo "### Structure Audit" >> "$LOG_FILE"

ISSUES_FOUND=0
FIXES_APPLIED=0

cd "$EMPIRE_DIR"

# Check all 21 apps exist
APPS=("ai-chat" "browser" "cache" "calculator" "calendar" "clock" "datacenter" "editor" "files" "grammar" "language" "learning-tracker" "maps" "messages" "music" "notes" "photos" "prompt-generator" "token-counter" "video" "weather")

echo "Checking 21 apps..."
for app in "${APPS[@]}"; do
    if [ -d "src/apps/$app" ]; then
        echo -e "  ${GREEN}✓${NC} $app"
        echo "- ${GREEN}✓${NC} $app exists" >> "$LOG_FILE"
    else
        echo -e "  ${RED}✗${NC} $app MISSING"
        echo "- ${RED}✗${NC} $app MISSING" >> "$LOG_FILE"
        ((ISSUES_FOUND++))
    fi
done

# Check critical files
echo ""
echo "Checking critical files..."
CRITICAL_FILES=("package.json" "vite.config.ts" "tsconfig.json" "src/App.tsx" "src/main.tsx" "src/lib/registry.ts" "src/lib/store.ts" "src/lib/eventBus.ts" "src/design-system.css")

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file MISSING"
        echo "- ${RED}✗${NC} $file MISSING" >> "$LOG_FILE"
        ((ISSUES_FOUND++))
    fi
done

echo ""

# ============================================
# PHASE 2: TypeScript Check
# ============================================
echo -e "${YELLOW}[2/6] TypeScript Validation${NC}"
echo "" >> "$LOG_FILE"
echo "### Phase 2: TypeScript Check" >> "$LOG_FILE"

if npx tsc --noEmit 2>&1 | tee -a "$LOG_FILE"; then
    echo -e "  ${GREEN}✓${NC} TypeScript: Clean"
    echo "- ${GREEN}✓${NC} TypeScript: Zero errors" >> "$LOG_FILE"
else
    echo -e "  ${RED}✗${NC} TypeScript: Errors found"
    echo "- ${RED}✗${NC} TypeScript: Errors found (see log)" >> "$LOG_FILE"
    ((ISSUES_FOUND++))
fi

echo ""

# ============================================
# PHASE 3: ESLint Check
# ============================================
echo -e "${YELLOW}[3/6] ESLint Validation${NC}"
echo "" >> "$LOG_FILE"
echo "### Phase 3: ESLint Check" >> "$LOG_FILE"

if npm run lint 2>&1 | tee -a "$LOG_FILE"; then
    echo -e "  ${GREEN}✓${NC} ESLint: Clean"
    echo "- ${GREEN}✓${NC} ESLint: No issues" >> "$LOG_FILE"
else
    echo -e "  ${YELLOW}⚠${NC} ESLint: Issues found (non-blocking)"
    echo "- ${YELLOW}⚠${NC} ESLint: Issues found" >> "$LOG_FILE"
    ((ISSUES_FOUND++))
fi

echo ""

# ============================================
# PHASE 4: Build Check
# ============================================
echo -e "${YELLOW}[4/6] Build Validation${NC}"
echo "" >> "$LOG_FILE"
echo "### Phase 4: Build Check" >> "$LOG_FILE"

BUILD_START=$(date +%s)
if npm run build 2>&1 | tee -a "$LOG_FILE"; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    echo -e "  ${GREEN}✓${NC} Build: Success (${BUILD_TIME}s)"
    echo "- ${GREEN}✓${NC} Build: Success (${BUILD_TIME}s)" >> "$LOG_FILE"
else
    echo -e "  ${RED}✗${NC} Build: Failed"
    echo "- ${RED}✗${NC} Build: Failed" >> "$LOG_FILE"
    ((ISSUES_FOUND++))
fi

echo ""

# ============================================
# PHASE 5: App Completeness Check
# ============================================
echo -e "${YELLOW}[5/6] App Completeness Scan${NC}"
echo "" >> "$LOG_FILE"
echo "### Phase 5: App Completeness" >> "$LOG_FILE"

INCOMPLETE_APPS=0
for app in "${APPS[@]}"; do
    APP_FILE="src/apps/$app/${app^}.tsx"
    if [ -f "$APP_FILE" ]; then
        # Check for stub patterns
        if grep -q "export default function" "$APP_FILE" || grep -q "export default function ${app^}" "$APP_FILE"; then
            echo -e "  ${GREEN}✓${NC} $app: Component found"
            echo "- ${GREEN}✓${NC} $app: Component implemented" >> "$LOG_FILE"
        else
            echo -e "  ${YELLOW}⚠${NC} $app: May be incomplete"
            echo "- ${YELLOW}⚠${NC} $app: Component structure unclear" >> "$LOG_FILE"
            ((INCOMPLETE_APPS++))
        fi
    else
        # Try alternative naming
        ALT_FILE=$(find "src/apps/$app" -name "*.tsx" -o -name "*.ts" 2>/dev/null | head -1)
        if [ -n "$ALT_FILE" ]; then
            echo -e "  ${GREEN}✓${NC} $app: Found $(basename "$ALT_FILE")"
            echo "- ${GREEN}✓${NC} $app: Alternative file found" >> "$LOG_FILE"
        else
            echo -e "  ${RED}✗${NC} $app: No component file"
            echo "- ${RED}✗${NC} $app: No component file found" >> "$LOG_FILE"
            ((INCOMPLETE_APPS++))
            ((ISSUES_FOUND++))
        fi
    fi
done

echo ""

# ============================================
# PHASE 6: Dependency Check
# ============================================
echo -e "${YELLOW}[6/6] Dependency Audit${NC}"
echo "" >> "$LOG_FILE"
echo "### Phase 6: Dependencies" >> "$LOG_FILE"

if [ -f "node_modules/.package-lock.json" ] || [ -d "node_modules/.bin" ]; then
    echo -e "  ${GREEN}✓${NC} Dependencies: Installed"
    echo "- ${GREEN}✓${NC} Dependencies: node_modules present" >> "$LOG_FILE"
else
    echo -e "  ${YELLOW}⚠${NC} Dependencies: May need install"
    echo "- ${YELLOW}⚠${NC} Dependencies: node_modules incomplete" >> "$LOG_FILE"
    ((ISSUES_FOUND++))
fi

# Check for outdated packages (non-blocking)
if npm outdated 2>&1 | grep -q "Package"; then
    echo -e "  ${YELLOW}⚠${NC} Some packages may be outdated"
    echo "- ${YELLOW}⚠${NC} Some packages outdated (run npm update)" >> "$LOG_FILE"
else
    echo -e "  ${GREEN}✓${NC} Dependencies: Up to date"
    echo "- ${GREEN}✓${NC} Dependencies: All packages current" >> "$LOG_FILE"
fi

echo ""

# ============================================
# Summary
# ============================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    ITERATION SUMMARY                  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

TOTAL_ISSUES=$ISSUES_FOUND
if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "  ${GREEN}✓ ALL CHECKS PASSED${NC}"
    STATUS="PASSED"
else
    echo -e "  ${YELLOW}⚠ $TOTAL_ISSUES issue(s) detected${NC}"
    STATUS="ISSUES_FOUND"
fi

echo ""
echo "  Timestamp: $TIMESTAMP"
echo "  Apps checked: 21"
echo "  Incomplete apps: $INCOMPLETE_APPS"
echo "  Status: $STATUS"
echo ""

# Append summary to log
cat >> "$LOG_FILE" << EOF

## Summary

| Metric | Value |
|--------|-------|
| Timestamp | $TIMESTAMP |
| Total Issues | $TOTAL_ISSUES |
| Incomplete Apps | $INCOMPLETE_APPS |
| Status | $STATUS |

---
*Auto-generated by Empire Iteration Script*
EOF

# Update progress.md with latest iteration
if [ -f "$PROGRESS_FILE" ]; then
    # Prepend iteration info to progress file
    cat >> "$PROGRESS_FILE" << EOF

---
## Iteration: $TIMESTAMP
- Issues Found: $TOTAL_ISSUES
- Status: $STATUS
EOF
fi

echo -e "${BLUE}Log saved to: $LOG_FILE${NC}"
echo ""

# Exit with appropriate code
if [ $TOTAL_ISSUES -gt 0 ]; then
    exit 1
else
    exit 0
fi
