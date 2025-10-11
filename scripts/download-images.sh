#!/bin/bash

# Script to download featured event photos from meetups.json
# Downloads all images with 1-second delay between requests

JSON_FILE="../src/data/meetups.json"
OUTPUT_DIR="../src/assets/meetups"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Extracting image URLs from $JSON_FILE..."

# Extract all image URLs (thumbUrl, standardUrl, highResUrl) from featuredEventPhoto objects
URLS=$(jq -r '.data.groupByUrlname.events.edges[].node.featuredEventPhoto | select(. != null) | .thumbUrl, .standardUrl, .highResUrl' "$JSON_FILE")

# Count total URLs
TOTAL=$(echo "$URLS" | wc -l | tr -d ' ')
echo "Found $TOTAL images to download"

# Counter
COUNT=0

# Download each image
while IFS= read -r url; do
  if [ -n "$url" ]; then
    COUNT=$((COUNT + 1))

    # Extract filename from URL (last part after the last /)
    filename=$(basename "$url")

    echo "[$COUNT/$TOTAL] Downloading: $filename"

    # Download the image
    curl -s -o "$OUTPUT_DIR/$filename" "$url"

    # Check if download was successful
    if [ $? -eq 0 ]; then
      echo "  ✓ Success"
    else
      echo "  ✗ Failed"
    fi

    # Add 1-second delay between requests (except for the last one)
    if [ $COUNT -lt $TOTAL ]; then
      sleep 1
    fi
  fi
done <<< "$URLS"

echo ""
echo "Download complete! All images saved to $OUTPUT_DIR"
echo "Total files downloaded: $COUNT"
