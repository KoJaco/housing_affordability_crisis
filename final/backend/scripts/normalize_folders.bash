#!/bin/bash

# Script to normalize folder structure for years 2005-2014
# Moves all .dat files from week subdirectories to the parent year directory
# Usage: ./scripts/normalize_folders.bash

DATA_DIR="./data"

if [ ! -d "$DATA_DIR" ]; then
    echo "Error: $DATA_DIR directory not found!"
    exit 1
fi

# Years to process
YEARS=(2005 2006 2007 2008 2009 2010 2011 2012 2013 2014)

total_moved=0
total_years=0

for year in "${YEARS[@]}"; do
    year_dir="$DATA_DIR/$year"
    
    if [ ! -d "$year_dir" ]; then
        echo "Skipping $year: directory not found"
        continue
    fi
    
    echo "Processing $year..."
    
    # Count .dat files in subdirectories
    dat_files=$(find "$year_dir" -mindepth 2 -type f -name "*.DAT" 2>/dev/null | wc -l)
    
    if [ "$dat_files" -eq 0 ]; then
        echo "  No .dat files found in subdirectories"
        continue
    fi
    
    echo "  Found $dat_files .dat file(s) in subdirectories"
    
    # Move all .dat files from subdirectories to the parent year directory
    moved_count=0
    while IFS= read -r -d '' datfile; do
        # Get just the filename
        filename=$(basename "$datfile")
        target="$year_dir/$filename"
        
        # Check if file already exists in target (shouldn't happen, but be safe)
        if [ -f "$target" ]; then
            echo "    Warning: $filename already exists in $year_dir, skipping"
            continue
        fi
        
        # Move the file
        if mv "$datfile" "$target" 2>/dev/null; then
            moved_count=$((moved_count + 1))
        else
            echo "    Error: Failed to move $datfile"
        fi
    done < <(find "$year_dir" -mindepth 2 -type f -name "*.DAT" -print0)
    
    echo "  Moved $moved_count file(s) to $year_dir"
    total_moved=$((total_moved + moved_count))
    
    # Remove empty subdirectories
    echo "  Cleaning up empty subdirectories..."
    find "$year_dir" -mindepth 1 -maxdepth 1 -type d -empty -delete 2>/dev/null
    removed_dirs=$(find "$year_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    if [ "$removed_dirs" -gt 0 ]; then
        echo "  Warning: $removed_dirs non-empty subdirectory(ies) remain"
    else
        echo "  All subdirectories cleaned up"
    fi
    
    total_years=$((total_years + 1))
    echo ""
done

echo "Normalization complete!"
echo "  Processed years: $total_years"
echo "  Total files moved: $total_moved"

