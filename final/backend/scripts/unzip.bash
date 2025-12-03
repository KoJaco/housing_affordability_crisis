#!/bin/bash

# Script to recursively unzip all zip files in the ./data directory
# Usage: ./scripts/unzip.bash

DATA_DIR="./data"

if [ ! -d "$DATA_DIR" ]; then
    echo "Error: $DATA_DIR directory not found!"
    exit 1
fi

echo "Finding all zip files in $DATA_DIR..."
zip_count=$(find "$DATA_DIR" -name "*.zip" -type f | wc -l)

if [ "$zip_count" -eq 0 ]; then
    echo "No zip files found in $DATA_DIR"
    exit 0
fi

echo "Found $zip_count zip file(s)"
echo "Starting extraction..."

# Counter for processed files
processed=0
failed=0
current=0

# Find and unzip all zip files
while IFS= read -r -d '' zipfile; do
    # Get the directory containing the zip file
    zipdir=$(dirname "$zipfile")
    zipname=$(basename "$zipfile")
    
    current=$((current + 1))
    echo "[$current/$zip_count] Extracting: $zipfile"
    
    # Extract to a temporary directory first
    tempdir=$(mktemp -d)
    
    if unzip -q -o "$zipfile" -d "$tempdir" 2>/dev/null; then
        # Check if there's a single top-level directory
        top_level_items=$(ls -A "$tempdir" | wc -l)
        
        if [ "$top_level_items" -eq 1 ]; then
            # Check if that single item is a directory
            single_item=$(ls -A "$tempdir")
            if [ -d "$tempdir/$single_item" ]; then
                # Move contents of the single directory up one level
                mv "$tempdir/$single_item"/* "$tempdir"/ 2>/dev/null
                rmdir "$tempdir/$single_item" 2>/dev/null
            fi
        fi
        
        # Move all extracted files to the target directory
        if [ "$(ls -A "$tempdir")" ]; then
            mv "$tempdir"/* "$zipdir"/ 2>/dev/null
            processed=$((processed + 1))
            echo "   Successfully extracted"
        else
            failed=$((failed + 1))
            echo "   No files extracted"
        fi
        
        # Clean up temp directory
        rmdir "$tempdir" 2>/dev/null
    else
        failed=$((failed + 1))
        echo "   Failed to extract"
        rmdir "$tempdir" 2>/dev/null
    fi
done < <(find "$DATA_DIR" -name "*.zip" -type f -print0)

echo ""
echo "Extraction complete!"
echo "  Successfully extracted: $processed"
echo "  Failed: $failed"
echo "  Total: $zip_count"

