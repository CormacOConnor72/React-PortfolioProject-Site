#!/bin/bash

# Convert tar.gz files to zip format for AWS Lambda upload

echo "🔄 Converting packages to ZIP format for AWS Lambda..."

# Check if we have any .tar.gz files
if ! ls *.tar.gz 1> /dev/null 2>&1; then
    echo "❌ No .tar.gz files found to convert"
    exit 1
fi

# Process each .tar.gz file
for TARFILE in *.tar.gz; do
    if [ -f "$TARFILE" ]; then
        BASENAME=$(basename "$TARFILE" .tar.gz)
        ZIPFILE="$BASENAME.zip"

        echo "📦 Converting $TARFILE to $ZIPFILE..."

        # Create temp directory
        TEMPDIR="temp_convert_$BASENAME"
        rm -rf "$TEMPDIR"
        mkdir "$TEMPDIR"

        # Extract tar.gz
        tar -xzf "$TARFILE" -C "$TEMPDIR"

        # Create zip (try different methods if zip command not available)
        cd "$TEMPDIR"
        if command -v zip >/dev/null 2>&1; then
            zip -r -q "../$ZIPFILE" .
        elif command -v python3 >/dev/null 2>&1; then
            python3 -c "
import zipfile
import os
with zipfile.ZipFile('../$ZIPFILE', 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('.'):
        for file in files:
            file_path = os.path.join(root, file)
            arc_path = os.path.relpath(file_path, '.')
            zf.write(file_path, arc_path)
"
        else
            echo "❌ Neither zip nor python3 available for creating ZIP files"
            cd ..
            rm -rf "$TEMPDIR"
            continue
        fi

        cd ..
        rm -rf "$TEMPDIR"

        # Check if zip was created successfully
        if [ -f "$ZIPFILE" ]; then
            SIZE=$(ls -lh "$ZIPFILE" | awk '{print $5}')
            echo "   ✅ Created: $ZIPFILE ($SIZE)"
        else
            echo "   ❌ Failed to create: $ZIPFILE"
        fi
    fi
done

echo ""
echo "🎉 Conversion complete! Upload these .zip files to AWS Lambda:"
echo ""

for ZIPFILE in *.zip; do
    if [ -f "$ZIPFILE" ]; then
        SIZE=$(ls -lh "$ZIPFILE" | awk '{print $5}')
        FUNC_NAME=$(basename "$ZIPFILE" .zip)
        echo "   📦 $ZIPFILE ($SIZE) → Upload to '$FUNC_NAME' Lambda function"
    fi
done