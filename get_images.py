import os
from PIL import Image, ImageOps
# Import the Resampling enum for newer Pillow versions
from PIL.Image import Resampling

# 1. Settings
INPUT_FOLDER = "daytrip"
OUTPUT_FOLDER = "daytrip_thumbs_webp"

# Desired thumbnail sizes for horizontal vs vertical
HORIZONTAL_SIZE = (800, 400)  # (width, height)
VERTICAL_SIZE = (400, 800)

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def center_crop_resize(img, final_w, final_h):
    """
    Resizes 'img' so that the smaller dimension fits 'final_*',
    then center-crops to exactly final_w x final_h.
    """
    img_aspect = img.width / img.height
    target_aspect = final_w / final_h

    if img_aspect > target_aspect:
        # Image is "wider" than target => scale by height
        scale = final_h / img.height
        new_w = int(img.width * scale)
        new_h = final_h
        img = img.resize((new_w, new_h), Resampling.LANCZOS)
    else:
        # Image is "taller" or same => scale by width
        scale = final_w / img.width
        new_w = final_w
        new_h = int(img.height * scale)
        img = img.resize((new_w, new_h), Resampling.LANCZOS)

    # Center-crop to exactly final_w x final_h
    left = (img.width - final_w) // 2
    top = (img.height - final_h) // 2
    right = left + final_w
    bottom = top + final_h
    return img.crop((left, top, right, bottom))

# We'll collect the HTML snippets in a list
html_snippets = []

for filename in sorted(os.listdir(INPUT_FOLDER)):
    # Only process .jpg/.jpeg
    if not filename.lower().endswith((".jpg", ".jpeg")):
        continue

    filepath = os.path.join(INPUT_FOLDER, filename)

    with Image.open(filepath) as img:
        # Auto-orient based on EXIF so width/height reflect actual orientation
        img = ImageOps.exif_transpose(img)
        w, h = img.size
        aspect = w / h

        # Decide orientation & desired final size
        if aspect > 1:
            orientation = "horizontal"
            final_w, final_h = HORIZONTAL_SIZE
        else:
            orientation = "vertical"
            final_w, final_h = VERTICAL_SIZE

        # Resize + center-crop
        thumb = center_crop_resize(img, final_w, final_h)

        # Prepare output paths
        base, ext = os.path.splitext(filename)
        out_name = base + ".webp"
        out_path = os.path.join(OUTPUT_FOLDER, out_name)

        # Save as WebP
        thumb.save(out_path, "WEBP", quality=80)

        # Build HTML snippet
        snippet = f'''<figure class="gallery-item {orientation}">
  <img
    src="thumbs_webp/{out_name}"
    data-full="images/{filename}"
    alt="{base}"
    loading="lazy"
  />
</figure>'''
        html_snippets.append(snippet)

        print(f"Processed {filename} -> {out_name}, orientation={orientation}, size={thumb.size}")

# Finally, print the full HTML block so user can copy+paste
print("\n\n--- HTML SNIPPETS BELOW ---\n")
for snippet in html_snippets:
    print(snippet)
