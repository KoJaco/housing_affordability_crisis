#!/bin/bash

# Script to merge all .DAT files from weekly 2025 folders into a single 2025 directory
# Usage: ./scripts/merge_2025.bash

DATA_DIR="./data"
TARGET_YEAR="2025"
TARGET_DIR="$DATA_DIR/$TARGET_YEAR"

if [ ! -d "$DATA_DIR" ]; then
    echo "Error: $DATA_DIR directory not found!"
    exit 1
fi

# Create target directory if it doesn't exist
if [ ! -d "$TARGET_DIR" ]; then
    echo "Creating $TARGET_DIR directory..."
    mkdir -p "$TARGET_DIR"
fi

echo "Finding all weekly 2025 folders..."
# Find all folders matching 2025* pattern (weekly folders)
weekly_folders=$(find "$DATA_DIR" -maxdepth 1 -type d -name "2025*" | sort)

if [ -z "$weekly_folders" ]; then
    echo "No weekly 2025 folders found!"
    exit 0
fi

folder_count=$(echo "$weekly_folders" | wc -l)
echo "Found $folder_count weekly folder(s)"
echo ""

total_moved=0
total_folders=0
skipped_conflicts=0

# Process each weekly folder
while IFS= read -r week_folder; do
    # Skip if it's the target directory itself
    if [ "$week_folder" = "$TARGET_DIR" ]; then
        continue
    fi
    
    folder_name=$(basename "$week_folder")
    echo "Processing $folder_name..."
    
    # Count .DAT files in this folder
    dat_count=$(find "$week_folder" -maxdepth 1 -type f -name "*.DAT" 2>/dev/null | wc -l)
    
    if [ "$dat_count" -eq 0 ]; then
        echo "  No .DAT files found, skipping"
        continue
    fi
    
    echo "  Found $dat_count .DAT file(s)"
    
    # Move all .DAT files from this weekly folder to the target directory
    moved_count=0
    while IFS= read -r -d '' datfile; do
        # Get just the filename
        filename=$(basename "$datfile")
        target="$TARGET_DIR/$filename"
        
        # Check if file already exists in target
        if [ -f "$target" ]; then
            echo "    Warning: $filename already exists in $TARGET_DIR, skipping"
            skipped_conflicts=$((skipped_conflicts + 1))
            continue
        fi
        
        # Move the file
        if mv "$datfile" "$target" 2>/dev/null; then
            moved_count=$((moved_count + 1))
        else
            echo "    Error: Failed to move $datfile"
        fi
    done < <(find "$week_folder" -maxdepth 1 -type f -name "*.DAT" -print0)
    
    echo "  Moved $moved_count file(s) to $TARGET_DIR"
    total_moved=$((total_moved + moved_count))
    
    # Check if folder is now empty (only . and .. should remain)
    remaining_files=$(find "$week_folder" -mindepth 1 -maxdepth 1 2>/dev/null | wc -l)
    if [ "$remaining_files" -eq 0 ]; then
        echo "  Removing empty folder: $week_folder"
        rmdir "$week_folder" 2>/dev/null
    else
        echo "  Warning: $week_folder still contains $remaining_files item(s)"
    fi
    
    total_folders=$((total_folders + 1))
    echo ""
done <<< "$weekly_folders"

echo "Merge complete!"
echo "  Processed folders: $total_folders"
echo "  Total files moved: $total_moved"
echo "  Skipped conflicts: $skipped_conflicts"
echo "  Target directory: $TARGET_DIR"

