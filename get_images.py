import os
from PIL import Image, ImageOps

# Folder where your original JPGs are
INPUT_FOLDER = "images"
# Folder where you want your new .webp thumbnails
OUTPUT_FOLDER = "thumbs_webp"

# Ensure output folder exists
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

for filename in os.listdir(INPUT_FOLDER):
    # Only process .jpg (or .jpeg) files
    if not filename.lower().endswith((".jpg", ".jpeg")):
        continue

    filepath = os.path.join(INPUT_FOLDER, filename)

    # Open image and auto-orient based on EXIF
    with Image.open(filepath) as img:
        # Fix any EXIF-based rotation so width/height reflect actual orientation
        img = ImageOps.exif_transpose(img)
        w, h = img.size

        # Determine if it's horizontal or vertical
        if (w, h) == (4000, 2252):
            # Horizontal image -> center crop to 4000x2000
            top = (2252 - 2000) // 2  # 126
            bottom = top + 2000       # 2126
            left = 0
            right = 4000
            img = img.crop((left, top, right, bottom))

        elif (w, h) == (2252, 4000):
            # Vertical image -> center crop to 2000x4000
            left = (2252 - 2000) // 2  # 126
            right = left + 2000        # 2126
            top = 0
            bottom = 4000
            img = img.crop((left, top, right, bottom))

        else:
            # If it's not exactly 4000x2252 or 2252x4000, we skip or handle differently
            print(f"Skipping {filename} (unexpected size {w}x{h})")
            continue

        # Convert filename to .webp
        base, ext = os.path.splitext(filename)
        out_name = base + ".webp"
        out_path = os.path.join(OUTPUT_FOLDER, out_name)

        # Save as WebP at quality=80 (adjust as desired)
        img.save(out_path, "WEBP", quality=80)

        print(f"Processed {filename} -> {out_name}, size = {img.size}")
