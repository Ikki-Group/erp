#!/usr/bin/env bash
#
# Single-command E2E test runner.
# Usage: ./scripts/test-e2e.sh [playwright args...]
#
# 1. Resets + seeds the test database (.env.test)
# 2. Starts server (port 4100) and web (port 3100) in background
# 3. Runs Playwright tests
# 4. Cleans up background processes on exit
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/apps/server"
WEB_DIR="$ROOT_DIR/apps/web"
E2E_DIR="$ROOT_DIR/apps/e2e"

# Test ports (isolated from dev)
export TEST_SERVER_PORT=4100
export TEST_WEB_PORT=3100

# PIDs to clean up
SERVER_PID=""
WEB_PID=""

cleanup() {
	echo ""
	echo "🧹 Cleaning up..."
	[ -n "$WEB_PID" ] && kill "$WEB_PID" 2>/dev/null && echo "   Stopped web (PID $WEB_PID)"
	[ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null && echo "   Stopped server (PID $SERVER_PID)"
	# A killed child's status (143) must not become the script's exit code under `set -e`.
	wait "$WEB_PID" 2>/dev/null || true
	wait "$SERVER_PID" 2>/dev/null || true
	echo "✅ Cleanup done."
}
trap cleanup EXIT

# ─── Step 0: Refuse to run against leftover processes ───
# A stale server from a previous run would keep serving with its in-memory
# auth cache (keyed by user id) after the DB is re-seeded with different ids.
for port in "$TEST_SERVER_PORT" "$TEST_WEB_PORT"; do
	if curl -s -o /dev/null --max-time 2 "http://localhost:$port"; then
		echo "❌ Port $port is already in use — stop the leftover process first."
		exit 1
	fi
done

# ─── Step 1: Reset + Seed Database ───

echo "🗄️  Resetting and seeding test database..."
cd "$SERVER_DIR"
NODE_ENV=test bun run scripts/db-scripts-helper.ts all
echo ""

# ─── Step 2: Start Server ───

echo "🚀 Starting server on port $TEST_SERVER_PORT..."
cd "$SERVER_DIR"
# REDIS_URL is blanked on purpose: env.ts also loads the dev `.env`, which would
# point the test server at the shared remote Redis. Its auth cache (access:<userId>)
# then outlives the re-seed, whose user ids differ run to run → wrong permissions.
REDIS_URL="" PORT="$TEST_SERVER_PORT" NODE_ENV=test bun run --env-file .env.test src/server.ts &
SERVER_PID=$!

# ─── Step 3: Start Web ───

echo "🌐 Starting web on port $TEST_WEB_PORT..."
cd "$WEB_DIR"
VITE_API_URL="http://localhost:$TEST_SERVER_PORT" bunx --bun vite dev --port "$TEST_WEB_PORT" &
WEB_PID=$!

# ─── Step 4: Wait for services ───

echo "⏳ Waiting for services to be ready..."

wait_for_port() {
	local port=$1
	local name=$2
	local path=${3:-}
	local max_attempts=30
	local attempt=0

	while ! curl -sf "http://localhost:$port$path" >/dev/null 2>&1; do
		attempt=$((attempt + 1))
		if [ "$attempt" -ge "$max_attempts" ]; then
			echo "❌ $name (port $port) failed to start after ${max_attempts}s"
			exit 1
		fi
		sleep 1
	done
	echo "   ✓ $name ready (port $port)"
}

wait_for_port "$TEST_SERVER_PORT" "Server" /health
wait_for_port "$TEST_WEB_PORT" "Web"
echo ""

# ─── Step 5: Run Playwright ───

echo "🎭 Running Playwright tests..."
echo ""
cd "$E2E_DIR"
TEST_EXIT=0
BASE_URL="http://localhost:$TEST_WEB_PORT" bunx playwright test "$@" || TEST_EXIT=$?

echo ""
if [ $TEST_EXIT -eq 0 ]; then
	echo "✅ All E2E tests passed!"
else
	echo "❌ Some tests failed. View report: bun run test:e2e:report"
fi

exit $TEST_EXIT
