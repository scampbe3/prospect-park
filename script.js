/*****************************************************
 * 1. INITIALIZE FIREBASE (replace with your config)
 *****************************************************/
const firebaseConfig = {
  apiKey: "AIzaSyC7YcVDZyQTn6MVimD9DNzs918fEyRhicI",
  authDomain: "prospect-gallery.firebaseapp.com",
  databaseURL: "https://prospect-gallery-default-rtdb.firebaseio.com",
  projectId: "prospect-gallery",
  storageBucket: "prospect-gallery.firebasestorage.app",
  messagingSenderId: "379482558702",
  appId: "1:379482558702:web:ba805e572f0b89e16323ff",
  measurementId: "G-LXM7S7LTYC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// Get Firestore
const db = firebase.firestore();

/*****************************************************
 * 2. GLOBAL VARIABLES & ELEMENTS
 *****************************************************/
const overlay = document.getElementById('lightbox-overlay');
const overlayImage = document.getElementById('lightbox-image');
const closeBtn = document.getElementById('close-btn');

const likeBtn = document.getElementById('like-btn');
const likeCountSpan = document.getElementById('like-count');
const commentList = document.getElementById('comment-list');
const commentInput = document.getElementById('comment-input');
const commentSubmitBtn = document.getElementById('comment-submit-btn');

// Prev & Next arrows (exist on both pages now)
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// All gallery images (works for both daytrip.html and index.html)
const galleryImages = document.querySelectorAll('.gallery-item img');

// Track current index in the gallery
let currentIndex = 0;
let currentImageSrc = ''; // The full-res image currently shown

/*****************************************************
 * 3. SHOW LIGHTBOX AT SPECIFIC INDEX
 *****************************************************/
async function showImageByIndex(index) {
  // If you want wrap-around, clamp index like so:
  if (index < 0) {
    index = galleryImages.length - 1;
  }
  if (index >= galleryImages.length) {
    index = 0;
  }

  currentIndex = index;
  overlay.style.display = 'flex';

  // Load the big JPG from data-full
  const thumb = galleryImages[currentIndex];
  const fullResUrl = thumb.getAttribute('data-full');
  overlayImage.src = fullResUrl;
  overlayImage.alt = thumb.alt;

  currentImageSrc = fullResUrl;

  // Load like/comment data from Firestore
  await loadImageData(currentImageSrc);
}

/*****************************************************
 * 4. GALLERY IMAGE CLICK -> OPEN LIGHTBOX
 *****************************************************/
galleryImages.forEach((img, i) => {
  img.addEventListener('click', () => {
    showImageByIndex(i);
  });
});

/*****************************************************
 * 5. CLOSE OVERLAY
 *****************************************************/
closeBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
});

// Close if user clicks outside the lightbox container
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) {
    overlay.style.display = 'none';
  }
});

// Close on ESC key
document.addEventListener('keydown', (e) => {
  if (overlay.style.display === 'flex' && e.key === 'Escape') {
    overlay.style.display = 'none';
  }
});

/*****************************************************
 * 6. PREV / NEXT
 *****************************************************/
function showNextImage() {
  showImageByIndex(currentIndex + 1);
}
function showPrevImage() {
  showImageByIndex(currentIndex - 1);
}

// Buttons
if (nextBtn) {
  nextBtn.addEventListener('click', showNextImage);
}
if (prevBtn) {
  prevBtn.addEventListener('click', showPrevImage);
}

// Left/Right arrow keys
document.addEventListener('keydown', (e) => {
  if (overlay.style.display === 'flex') {
    if (e.key === 'ArrowRight') {
      showNextImage();
    } else if (e.key === 'ArrowLeft') {
      showPrevImage();
    }
  }
});

/*****************************************************
 * 7. LOAD & RENDER DATA FROM FIRESTORE
 *****************************************************/
async function loadImageData(imageSrc) {
  // Convert imageSrc to doc ID
  const docId = encodeURIComponent(imageSrc);

  // 1. Load doc for this image
  const docRef = db.collection('images').doc(docId);
  const docSnap = await docRef.get();

  let likes = 0;
  if (docSnap.exists) {
    const data = docSnap.data();
    likes = data.likes || 0;
  } else {
    // Initialize doc if none
    await docRef.set({ likes: 0 });
  }
  likeCountSpan.textContent = likes;

  // 2. Load comments subcollection
  const commentsRef = docRef.collection('comments').orderBy('timestamp', 'asc');
  const commentsSnap = await commentsRef.get();

  const comments = [];
  commentsSnap.forEach((c) => {
    comments.push(c.data());
  });

  renderComments(comments);
}

/*****************************************************
 * 8. LIKING AN IMAGE
 *****************************************************/
likeBtn.addEventListener('click', async () => {
  if (!currentImageSrc) return;

  const username = prompt('Please enter your username to like this photo:');
  if (!username) {
    alert('Username is required to like a photo.');
    return;
  }

  const docId = encodeURIComponent(currentImageSrc);
  const docRef = db.collection('images').doc(docId);

  // Use a transaction to increment likes safely
  await db.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (!docSnap.exists) {
      transaction.set(docRef, { likes: 1 });
      likeCountSpan.textContent = '1';
    } else {
      const newLikes = (docSnap.data().likes || 0) + 1;
      transaction.update(docRef, { likes: newLikes });
      likeCountSpan.textContent = newLikes.toString();
    }
  });
});

/*****************************************************
 * 9. COMMENTING
 *****************************************************/
commentSubmitBtn.addEventListener('click', async () => {
  if (!currentImageSrc) return;

  const commentText = commentInput.value.trim();
  if (!commentText) {
    alert('Comment cannot be empty.');
    return;
  }

  const username = prompt('Please enter your username to comment:');
  if (!username) {
    alert('Username is required to comment.');
    return;
  }

  // Clear input
  commentInput.value = '';

  const docId = encodeURIComponent(currentImageSrc);
  const docRef = db.collection('images').doc(docId);
  const commentsCollection = docRef.collection('comments');

  // Add new comment
  await commentsCollection.add({
    username,
    text: commentText,
    timestamp: Date.now()
  });

  // Reload data to refresh comments
  await loadImageData(currentImageSrc);
});

/*****************************************************
 * 10. RENDER COMMENTS
 *****************************************************/
function renderComments(commentsArray) {
  commentList.innerHTML = '';

  commentsArray.forEach((c) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${c.username}:</strong> ${c.text}`;
    commentList.appendChild(li);
  });
}
