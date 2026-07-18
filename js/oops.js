let builds = [];
const config = {
  "buildsPath": "../configuration/builds.json"
};

// Fetch builds.json when page loads
function loadBuilds() {
  fetch(config.buildsPath)
    .then(res => res.json())
    .then(data => {
      builds = data;
      initializeOopsPage();
    })
    .catch(err => {
      console.error('Failed to load builds.json:', err);
      initializeOopsPage(); // Try with sessionStorage fallback
    });
}

function getItemIndex() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('index')) || null;
}

function initializeOopsPage() {
  const itemIndex = getItemIndex();
  let itemData = null;

  // Try to get from builds array first
  if (itemIndex !== null && builds[itemIndex]) {
    itemData = builds[itemIndex];
  } else {
    // Fallback to sessionStorage
    const stored = sessionStorage.getItem('oopsItemData');
    if (stored) {
      itemData = JSON.parse(stored);
    }
  }

  if (!itemData) {
    console.warn('No item data found');
    return;
  }

  // Display item info
  if (itemData.title) {
    document.getElementById('itemTitle').textContent = itemData.title;
  }
  if (itemData.desc) {
    document.getElementById('itemDesc').textContent = itemData.desc;
  }

  // Start countdown
  startCountdown(itemData.expiryDate);
}

function startCountdown(expiryDateString) {
  if (!expiryDateString) {
    document.getElementById('countdownText').textContent = 'Unknown expiry date';
    return;
  }

  const expiryTime = new Date(expiryDateString).getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = expiryTime - now;

    if (diff <= 0) {
      document.getElementById('countdownText').textContent = 'Available now!';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let timeText = '';

    if (days > 10) {
      // Show days and hours only
      timeText = `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (days > 0) {
      // Show days, hours, and minutes
      timeText = `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min`;
    } else {
      // Show only hours and minutes
      timeText = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min`;
    }

    document.getElementById('countdownText').textContent = timeText;
  }

  // Update immediately
  updateCountdown();

  // Update every minute
  setInterval(updateCountdown, 60000);
}

function goBack() {
  window.history.back();
}

// Load builds and initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBuilds);
} else {
  loadBuilds();
}
