import os

# Path to your images folder
image_folder = 'images'

# Valid image extensions (case-insensitive)
valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}

# Get sorted list of files in the images folder
files = sorted(os.listdir(image_folder))

# Loop over each file and check if it has a valid image extension
for filename in files:
    # Extract the file extension in lowercase
    _, ext = os.path.splitext(filename)
    ext = ext.lower()

    # If it's one of our valid extensions, print out the HTML snippet
    if ext in valid_extensions:
        # We'll strip any special characters from the filename for use in alt text
        alt_text = filename.rsplit('.', 1)[0].replace('-', ' ').replace('_', ' ')

        # Print the <figure> block
        print(f'<figure class="gallery-item">')
        print(f'  <img src="images/{filename}" alt="{alt_text}" loading="lazy" />')
        print(f'</figure>')
