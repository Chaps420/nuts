#!/bin/bash

# Start the $NUTS Sports Pick'em Platform
echo "🚀 Starting $NUTS Sports Pick'em Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the XUMM payment server in background
echo "💳 Starting XUMM payment server..."
node xumm-server.js &
XUMM_PID=$!

# Wait a moment for the server to start
sleep 2

# Start the web server
echo "🌐 Starting web server..."
npm run dev &
WEB_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $XUMM_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo ""
echo "✅ $NUTS Sports Pick'em Platform is running!"
echo "🌐 Website: http://localhost:3000"
echo "💳 Payment API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for either process to finish
wait
