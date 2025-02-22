/*****************************************************
 * 1. INITIALIZE FIREBASE (replace with your config)
 *****************************************************/
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
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

  let currentImageSrc = ''; // Tracks which image is currently open

  /*****************************************************
   * 3. LIGHTBOX HANDLING
   *****************************************************/
  // Grab all the gallery images
  const galleryImages = document.querySelectorAll('.gallery-item img');

  // Show overlay with full-size image on click
  galleryImages.forEach((thumb) => {
    thumb.addEventListener('click', async () => {
      overlay.style.display = 'flex';

      // Load the full-res image from data-full instead of the thumbnail
      const fullResUrl = thumb.getAttribute('data-full');
      overlayImage.src = fullResUrl;
      overlayImage.alt = thumb.alt;

      currentImageSrc = fullResUrl; // We'll use this to reference Firestore doc

      // Load like & comment data from Firestore
      await loadImageData(currentImageSrc);
    });
  });

  // Close overlay with the (×) button
  closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  // Close overlay when clicking the background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.display = 'none';
    }
  });

  // Close overlay with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      overlay.style.display = 'none';
    }
  });

  /*****************************************************
   * 4. LOAD & RENDER DATA FROM FIRESTORE
   *****************************************************/

  // Load likes and comments for the given image (by its src path)
  async function loadImageData(imageSrc) {
    // Convert imageSrc to a doc ID (encode special chars)
    const docId = encodeURIComponent(imageSrc);

    // 1. Load the doc for this image from Firestore
    const docRef = db.collection('images').doc(docId);
    const docSnap = await docRef.get();

    let likes = 0;
    if (docSnap.exists) {
      const data = docSnap.data();
      likes = data.likes || 0;
    } else {
      // Initialize doc if it doesn’t exist
      await docRef.set({ likes: 0 });
    }
    likeCountSpan.textContent = likes;

    // 2. Load the comments from subcollection "comments"
    const commentsRef = docRef.collection('comments').orderBy('timestamp', 'asc');
    const commentsSnap = await commentsRef.get();

    const comments = [];
    commentsSnap.forEach((c) => {
      comments.push(c.data());
    });

    renderComments(comments);
  }

  /*****************************************************
   * 5. LIKING AN IMAGE
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

    // Use a transaction to safely increment the like count
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
   * 6. COMMENTING
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

    // Clear the input
    commentInput.value = '';

    const docId = encodeURIComponent(currentImageSrc);
    const docRef = db.collection('images').doc(docId);
    const commentsCollection = docRef.collection('comments');

    // Add a new comment doc
    await commentsCollection.add({
      username: username,
      text: commentText,
      timestamp: Date.now()
    });

    // Reload data to refresh the comments
    await loadImageData(currentImageSrc);
  });

  /*****************************************************
   * 7. RENDER COMMENTS
   *****************************************************/
  function renderComments(commentsArray) {
    commentList.innerHTML = '';

    commentsArray.forEach((c) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${c.username}:</strong> ${c.text}`;
      commentList.appendChild(li);
    });
  }
