#!/bin/bash

# Scout Backend Setup Script

echo "🚀 Setting up Scout Content Backend..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Initialize database
echo "🗄️  Initializing database..."
npm run init-db

if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi

echo "✅ Database initialized"
echo ""

# Ask if user wants to migrate files
echo "📁 Do you want to migrate existing files now? (y/n)"
read -r migrate

if [ "$migrate" = "y" ] || [ "$migrate" = "Y" ]; then
    echo "🔄 Starting file migration..."
    npm run migrate
    echo "✅ Migration complete"
else
    echo "⏭️  Skipping migration (you can run 'npm run migrate' later)"
fi

echo ""
echo "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "="
echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To run in development mode:"
echo "  npm run dev"
echo ""
echo "To migrate files later:"
echo "  npm run migrate"
echo ""
echo "To test the API:"
echo "  npm test"
echo ""
echo "📚 Check README.md for full documentation"
echo "🚀 Check QUICKSTART.md for quick start guide"
echo "🌐 Check DEPLOYMENT.md for deployment options"
echo ""
echo "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "="
