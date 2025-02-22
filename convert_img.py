import os
from PIL import Image

# Set up input/output folders
input_folder = 'images'
output_folder = 'thumbs_webp'
max_size = 500  # Max width/height for thumbnails

# Ensure output folder exists
os.makedirs(output_folder, exist_ok=True)

valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'}

for filename in os.listdir(input_folder):
    base, ext = os.path.splitext(filename.lower())
    if ext in valid_extensions:
        img_path = os.path.join(input_folder, filename)
        with Image.open(img_path) as img:
            # Resize
            img.thumbnail((max_size, max_size))

            # Convert/Save as WebP
            output_path = os.path.join(output_folder, base + '.webp')
            img.save(output_path, 'WEBP', quality=80)

        print(f'Created thumbnail webp: {output_path}')
