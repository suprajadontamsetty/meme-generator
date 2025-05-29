const memeSelect = document.getElementById('meme-select');
const memeImage = document.getElementById('meme-image');
const memeContainer = document.getElementById('meme-container');
const addTextBtn = document.getElementById('add-text-btn');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const shareMsg = document.getElementById('share-msg');

const textControls = document.getElementById('text-controls');
const textInput = document.getElementById('text-input');
const fontSizeInput = document.getElementById('font-size-input');
const colorInput = document.getElementById('color-input');
const fontFamilySelect = document.getElementById('font-family-select');

let memes = [];
let texts = []; // Array to store text boxes info
let selectedTextObj = null;

// Load memes from API
async function loadMemes() {
  try {
    const res = await fetch('https://api.imgflip.com/get_memes');
    const data = await res.json();
    if (data.success) {
      memes = data.data.memes;
      memeSelect.innerHTML = memes.map(m => `<option value="${m.url}">${m.name}</option>`).join('');
      memeSelect.selectedIndex = 0;
      updateMemeImage();
    } else {
      memeSelect.innerHTML = '<option>Error loading memes</option>';
    }
  } catch (e) {
    memeSelect.innerHTML = '<option>Error loading memes</option>';
    console.error(e);
  }
}

// Update meme image and clear texts
function updateMemeImage() {
  const url = memeSelect.value;
  memeImage.src = url;
  clearTexts();
  shareMsg.textContent = '';
  hideTextControls();
  selectedTextObj = null;
}

memeSelect.addEventListener('change', updateMemeImage);

// Clear all existing text boxes
function clearTexts() {
  texts = [];
  // Remove all .meme-text-box elements
  const boxes = memeContainer.querySelectorAll('.meme-text-box');
  boxes.forEach(box => box.remove());
}

// Create new draggable text box
function createTextBox(text = 'NEW TEXT', fontSize = 36, color = '#FFFFFF', fontFamily = 'Impact, Arial Black, sans-serif') {
  const box = document.createElement('div');
  box.classList.add('meme-text-box');
  box.contentEditable = true;
  box.spellcheck = false;
  box.textContent = text;
  box.style.left = '50%';
  box.style.top = '50%';
  box.style.transform = 'translate(-50%, -50%)';
  box.style.fontSize = fontSize + 'px';
  box.style.color = color;
  box.style.fontFamily = fontFamily;
  memeContainer.appendChild(box);

  // Store data for this box
  const textObj = {
    element: box,
    xPercent: 50, // Position as % relative to container
    yPercent: 50,
    text: text,
    fontSize,
    color,
    fontFamily
  };
  texts.push(textObj);

  // Dragging vars
  let isDragging = false;
  let startX, startY;

  box.addEventListener('mousedown', e => {
    if (e.target === box) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      // Disable text selection while dragging
      document.body.style.userSelect = 'none';
      box.style.borderColor = '#ff4757';
    }
  });

  // --- Touch support for mobile devices ---
box.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  isDragging = true;
  startX = touch.clientX;
  startY = touch.clientY;
  document.body.style.userSelect = 'none';
  box.style.borderColor = '#ff4757';
}, { passive: true });

window.addEventListener('touchend', () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = '';
    box.style.borderColor = 'transparent';
    updateTextPositions();
  }
});

window.addEventListener('touchmove', e => {
  if (!isDragging) return;

  const touch = e.touches[0];
  const dx = touch.clientX - startX;
  const dy = touch.clientY - startY;

  const containerRect = memeContainer.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();

  let newLeftPx = boxRect.left - containerRect.left + dx;
  let newTopPx = boxRect.top - containerRect.top + dy;

  newLeftPx = Math.max(0, Math.min(newLeftPx, containerRect.width - boxRect.width));
  newTopPx = Math.max(0, Math.min(newTopPx, containerRect.height - boxRect.height));

  const newLeftPercent = (newLeftPx / containerRect.width) * 100;
  const newTopPercent = (newTopPx / containerRect.height) * 100;

  box.style.left = newLeftPercent + '%';
  box.style.top = newTopPercent + '%';
  box.style.transform = 'translate(0, 0)';

  startX = touch.clientX;
  startY = touch.clientY;

  textObj.xPercent = newLeftPercent;
  textObj.yPercent = newTopPercent;
}, { passive: false });


  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = '';
      box.style.borderColor = 'transparent';
      // Update position percentages after drag ends
      updateTextPositions();
    }
  });

  window.addEventListener('mousemove', e => {
    if (isDragging) {
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Get container rect and box rect
      const containerRect = memeContainer.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();

      // Calculate new positions in px (relative to container)
      let newLeftPx = boxRect.left - containerRect.left + dx;
      let newTopPx = boxRect.top - containerRect.top + dy;

      // Clamp inside container
      newLeftPx = Math.max(0, Math.min(newLeftPx, containerRect.width - boxRect.width));
      newTopPx = Math.max(0, Math.min(newTopPx, containerRect.height - boxRect.height));

      // Convert to percent for responsive positioning
      const newLeftPercent = (newLeftPx / containerRect.width) * 100;
      const newTopPercent = (newTopPx / containerRect.height) * 100;

      // Update style
      box.style.left = newLeftPercent + '%';
      box.style.top = newTopPercent + '%';
      box.style.transform = 'translate(0, 0)';

      // Update start for next movement
      startX = e.clientX;
      startY = e.clientY;

      // Update in texts array
      textObj.xPercent = newLeftPercent;
      textObj.yPercent = newTopPercent;
    }
  });

  // Update text in object on input
  box.addEventListener('input', () => {
    textObj.text = box.textContent;
    if (textObj === selectedTextObj) {
      textInput.value = textObj.text;
    }
  });

  // On click, select this text box and show controls
  box.addEventListener('click', e => {
    e.stopPropagation();
    selectTextBox(textObj);
  });

  selectTextBox(textObj);
}

// Select a text box for editing
function selectTextBox(textObj) {
  // Deselect previous
  texts.forEach(t => {
    t.element.style.borderColor = 'transparent';
  });

  selectedTextObj = textObj;
  selectedTextObj.element.style.borderColor = '#ff4757';

  // Show controls and fill with selected text data
  textControls.style.display = 'flex';
  textInput.value = textObj.text;
  fontSizeInput.value = textObj.fontSize;
  colorInput.value = textObj.color;
  fontFamilySelect.value = textObj.fontFamily;
}

// Hide controls when no text box selected
function hideTextControls() {
  textControls.style.display = 'none';
  selectedTextObj = null;
}

// Update text positions on drag end
function updateTextPositions() {
  // Already updated in drag, so this can be empty or used to sync if needed
}

// Click outside text boxes to deselect
memeContainer.addEventListener('click', () => {
  texts.forEach(t => t.element.style.borderColor = 'transparent');
  hideTextControls();
});

// Controls input event listeners to update selected text box
textInput.addEventListener('input', () => {
  if (!selectedTextObj) return;
  selectedTextObj.text = textInput.value;
  selectedTextObj.element.textContent = textInput.value;
});

fontSizeInput.addEventListener('input', () => {
  if (!selectedTextObj) return;
  const size = parseInt(fontSizeInput.value, 10);
  if (isNaN(size) || size < 10) return;
  selectedTextObj.fontSize = size;
  selectedTextObj.element.style.fontSize = size + 'px';
});

colorInput.addEventListener('input', () => {
  if (!selectedTextObj) return;
  selectedTextObj.color = colorInput.value;
  selectedTextObj.element.style.color = colorInput.value;
});

fontFamilySelect.addEventListener('change', () => {
  if (!selectedTextObj) return;
  selectedTextObj.fontFamily = fontFamilySelect.value;
  selectedTextObj.element.style.fontFamily = fontFamilySelect.value;
});

// Download meme with text rendered on canvas
downloadBtn.addEventListener('click', () => {
  if (!memeImage.src) {
    alert('Please select a meme image first.');
    return;
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = memeImage;

  // Set canvas size to image natural size for good quality
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  ctx.drawImage(img, 0, 0);

  texts.forEach(t => {
    // Scale font size relative to canvas size and container width
    const scaleFactor = canvas.width / memeContainer.clientWidth;
    ctx.font = `bold ${t.fontSize * scaleFactor}px ${t.fontFamily}`;
    ctx.fillStyle = t.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Calculate position relative to canvas size
    const x = (t.xPercent / 100) * canvas.width;
    const y = (t.yPercent / 100) * canvas.height;

    // Draw black outline for readability
    ctx.lineWidth = t.fontSize * 0.15 * scaleFactor;
    ctx.strokeStyle = 'black';
    ctx.strokeText(t.text.toUpperCase(), x, y);
    ctx.fillText(t.text.toUpperCase(), x, y);
  });

  // Trigger download
  const link = document.createElement('a');
  link.download = 'meme.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// Share meme image URL with text data encoded (simplified)
shareBtn.addEventListener('click', () => {
  if (!memeImage.src) {
    alert('Please select a meme image first.');
    return;
  }
  // For demo, just copy the meme image URL (complex sharing would require backend)
  navigator.clipboard.writeText(memeImage.src)
    .then(() => {
      shareMsg.textContent = 'Meme image URL copied to clipboard!';
      setTimeout(() => shareMsg.textContent = '', 3000);
    })
    .catch(() => {
      shareMsg.textContent = 'Failed to copy link.';
      setTimeout(() => shareMsg.textContent = '', 3000);
    });
});

// Add new text box
addTextBtn.addEventListener('click', () => {
  createTextBox();
});

// Initialize app
loadMemes();

const whatsappBtn = document.getElementById('whatsapp-share-btn');

whatsappBtn.addEventListener('click', () => {
  if (!memeImage.src) {
    alert("Please select a meme first.");
    return;
  }

  // Render meme with text to canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = memeImage;

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  texts.forEach(t => {
    const scaleFactor = canvas.width / memeContainer.clientWidth;
    ctx.font = `bold ${t.fontSize * scaleFactor}px ${t.fontFamily}`;
    ctx.fillStyle = t.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.lineWidth = t.fontSize * 0.15 * scaleFactor;
    ctx.strokeStyle = 'black';
    const x = (t.xPercent / 100) * canvas.width;
    const y = (t.yPercent / 100) * canvas.height;
    ctx.strokeText(t.text.toUpperCase(), x, y);
    ctx.fillText(t.text.toUpperCase(), x, y);
  });

  // Convert canvas to data URL
  const dataURL = canvas.toDataURL("image/png");

  // Convert to Blob for file sharing (not fully supported in WhatsApp Web yet)
  canvas.toBlob(blob => {
    const file = new File([blob], "meme.png", { type: "image/png" });
    
    // Fallback: Share image via WhatsApp text message
    const msg = encodeURIComponent("Check out this meme I made!");
    const url = encodeURIComponent(memeImage.src);
    const whatsappURL = `https://wa.me/?text=${msg}%0A${url}`;
    
    window.open(whatsappURL, "_blank");
  });
});




