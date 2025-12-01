#!/bin/bash

# Create recovery directories
mkdir -p ./recovered_files/components
mkdir -p ./recovered_files/pages

# Copy all recent VS Code history files to examine them
echo "Copying VS Code history files..."
cp ~/Library/Application\ Support/Code/User/History/-4e9ff4da/*.tsx ./recovered_files/components/ 2>/dev/null || true

# Search for specific components you mentioned
echo "Searching for your lost components..."

echo "Files containing SoundControls:"
grep -l "SoundControls" ./recovered_files/components/*.tsx 2>/dev/null || echo "None found"

echo "Files containing SectionIndicator (vertical nav):"
grep -l "SectionIndicator" ./recovered_files/components/*.tsx 2>/dev/null || echo "None found"

echo "Files containing Sound component definitions:"
grep -l "export.*Sound\|function.*Sound\|const.*Sound" ./recovered_files/components/*.tsx 2>/dev/null || echo "None found"

echo "Files containing vertical navigation:"
grep -l "vertical.*nav\|VerticalNav" ./recovered_files/components/*.tsx 2>/dev/null || echo "None found"

echo "Recovery complete. Check ./recovered_files/ directory."