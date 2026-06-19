#!/bin/bash
# Empire Expert Iteration Script - World-Class QA
# Runs every hour to audit, build, and validate the Empire suite
# Author: Hermes Agent for Jondri

# Don't exit on error - we want to continue through all phases
# set -e

# Configuration
EMPIRE_DIR="$HOME/Desktop/empire"
LOG_DIR="$EMPIRE_DIR/logs"
LOG_FILE="$LOG_DIR/iteration-$(date '+%Y-%m-%d-%H%M').log"
SUMMARY_FILE="$EMPIRE_DIR/docs/archive/iteration-summary.md"
METRICS_FILE="$EMPIRE_DIR/docs/archive/metrics.json"

# Thresholds
BUILD_TIME_THRESHOLD=120
APP_COUNT_EXPECTED=21

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Initialize
mkdir -p "$LOG_DIR"
cd "$EMPIRE_DIR"

TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
RUN_ID="$(date '+%Y%m%d-%H%M%S')"

echo -e "${BLUE}${BOLD}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           EMPIRE EXPERT ITERATION - WORLD-CLASS QA             ║"
echo "║                     Run ID: $RUN_ID                      ║"
echo "║                     $TIMESTAMP                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

ISSUES_FOUND=0
COMPLETE_APPS=0

# =============================================================================
# PHASE 1: STRUCTURE AUDIT
# =============================================================================
echo -e "\n${BLUE}${BOLD}[1/6] STRUCTURE AUDIT${NC}"
APPS=(ai-chat browser cache calculator calendar clock datacenter editor files grammar language learning-tracker maps messages music notes photos prompt-generator token-counter video weather)

for app in "${APPS[@]}"; do
    if [ -d "src/apps/$app" ]; then
        COMPONENT=$(find "src/apps/$app" -maxdepth 1 -name "*.tsx" 2>/dev/null | head -1)
        if [ -n "$COMPONENT" ]; then
            echo -e "  ${GREEN}✓${NC} $app"
            ((COMPLETE_APPS++))
        else
            echo -e "  ${YELLOW}⚠${NC} $app (no component)"
            ((ISSUES_FOUND++))
        fi
    else
        echo -e "  ${RED}✗${NC} $app (missing)"
        ((ISSUES_FOUND++))
    fi
done

# =============================================================================
# PHASE 2: DEPENDENCY CHECK
# =============================================================================
echo -e "\n${BLUE}${BOLD}[2/6] DEPENDENCY CHECK${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Installing dependencies..."
    npm install --silent
fi

# =============================================================================
# PHASE 3: BUILD
# =============================================================================
echo -e "\n${BLUE}${BOLD}[3/6] BUILD VALIDATION${NC}"
BUILD_START=$(date +%s)

if npm run build 2>&1 | tee -a "$LOG_FILE"; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    echo -e "${GREEN}✓${NC} Build: SUCCESS (${BUILD_TIME}s)"
else
    echo -e "${RED}✗${NC} Build: FAILED"
    ((ISSUES_FOUND+=5))
fi

# =============================================================================
# PHASE 4: APP COMPLETENESS
# =============================================================================
echo -e "\n${BLUE}${BOLD}[4/6] APP COMPLETENESS${NC}"
for app in "${APPS[@]}"; do
    APP_FILE=$(find "src/apps/$app" -name "*.tsx" 2>/dev/null | head -1)
    if [ -n "$APP_FILE" ]; then
        LINES=$(wc -l < "$APP_FILE" 2>/dev/null || echo "0")
        if [ "$LINES" -gt 10 ]; then
            echo -e "  ${GREEN}✓${NC} $app ($LINES lines)"
        else
            echo -e "  ${YELLOW}⚠${NC} $app (stub: $LINES lines)"
            ((ISSUES_FOUND++))
        fi
    fi
done

# =============================================================================
# PHASE 5: DIST VALIDATION
# =============================================================================
echo -e "\n${BLUE}${BOLD}[5/6] DIST VALIDATION${NC}"
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    DIST_FILES=$(find dist -type f | wc -l)
    echo -e "${GREEN}✓${NC} dist/ folder: $DIST_SIZE ($DIST_FILES files)"
else
    echo -e "${YELLOW}⚠${NC} dist/ folder missing"
    ((ISSUES_FOUND++))
fi

# =============================================================================
# PHASE 6: METRICS
# =============================================================================
echo -e "\n${BLUE}${BOLD}[6/6] METRICS${NC}"
if [ -d "dist/assets" ]; then
    BUNDLE_SIZE=$(du -sk dist/assets 2>/dev/null | cut -f1)
    echo -e "${CYAN}Bundle Size:${NC} ${BUNDLE_SIZE}KB"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "\n${BLUE}${BOLD}══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}${BOLD}                    ITERATION SUMMARY                       ${NC}"
echo -e "${BLUE}${BOLD}══════════════════════════════════════════════════════════${NC}\n"

STATUS="PASSED"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}${BOLD}  ✓ ALL CHECKS PASSED${NC}"
elif [ $ISSUES_FOUND -le 3 ]; then
    echo -e "${YELLOW}${BOLD}  ⚠ $ISSUES_FOUND minor issue(s)${NC}"
    STATUS="WARNINGS"
else
    echo -e "${RED}${BOLD}  ✗ $ISSUES_FOUND issue(s) found${NC}"
    STATUS="ISSUES_FOUND"
fi

echo -e "\n  Run ID:        $RUN_ID"
echo -e "  Timestamp:     $TIMESTAMP"
echo -e "  Apps Complete: $COMPLETE_APPS / ${#APPS[@]}"
echo -e "  Issues:        $ISSUES_FOUND"
echo -e "  Status:        $STATUS"

# Save summary
cat > "$SUMMARY_FILE" << EOF
# Empire Iteration Summary

## Run: $RUN_ID
**Timestamp:** $TIMESTAMP  
**Status:** $STATUS

| Metric | Value |
|--------|-------|
| Apps Complete | $COMPLETE_APPS / ${#APPS[@]} |
| Issues Found | $ISSUES_FOUND |
| Status | $STATUS |

---
*Generated by Empire Expert Iteration Script*
EOF

# Save metrics
cat > "$METRICS_FILE" << EOF
{
  "run_id": "$RUN_ID",
  "timestamp": "$TIMESTAMP",
  "status": "$STATUS",
  "apps_total": ${#APPS[@]},
  "apps_complete": $COMPLETE_APPS,
  "issues_count": $ISSUES_FOUND
}
EOF

echo -e "\n${CYAN}Summary: $SUMMARY_FILE${NC}"

[ "$STATUS" = "PASSED" ] && exit 0 || exit 1
