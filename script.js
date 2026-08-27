const elementsToReveal = document.querySelectorAll('.reveal-on-scroll');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15
});

elementsToReveal.forEach(el => observer.observe(el));

// Load and render gallery from JSON
async function loadGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  try {
    const response = await fetch(`images/photos.json?t=${Date.now()}`);
    if (!response.ok) throw new Error('Failed to fetch photos.json');
    const photos = await response.json();

    photos.forEach(photo => {
      const figure = document.createElement('figure');
      figure.className = 'gallery-item reveal-on-scroll';

      figure.innerHTML = `
        <div class="gallery-img-wrapper">
          <img src="${photo.file}" alt="${photo.caption.title}" style="object-position: ${photo.position || 'center'};">
        </div>
        <figcaption>
          <span class="photo-title">${photo.caption.title}</span>
          <span class="photo-meta">${photo.caption.meta}</span>
        </figcaption>
      `;

      grid.appendChild(figure);
      // Observe the newly created element for scroll reveal animation
      observer.observe(figure);
    });
  } catch (error) {
    console.error('Error loading gallery photos:', error);
  }
}

loadGallery();

// Load and render mountains from JSON
async function loadMountains() {
  const grid = document.querySelector('.card-grid');
  if (!grid) return;

  try {
    const response = await fetch(`mountains.json?t=${Date.now()}`);
    if (!response.ok) throw new Error('Failed to fetch mountains.json');
    const mountains = await response.json();

    // 1. Calculate statistics
    let climbedCount = 0;
    let totalElevationGain = 0;
    let plannedCount = 0;
    let maxElevation = 0;

    mountains.forEach(m => {
      const elev = Number(m.elevation);
      if (m.status === 'climbed') {
        climbedCount++;
        totalElevationGain += elev;
        if (elev > maxElevation) maxElevation = elev;
      } else if (m.status === 'planning') {
        plannedCount++;
      }
    });

    // Populate Section 03 dynamic stats
    const statClimbedEl = document.getElementById('stat-climbed');
    const statElevationEl = document.getElementById('stat-elevation');
    const statPlannedEl = document.getElementById('stat-planned');
    if (statClimbedEl) statClimbedEl.textContent = climbedCount;
    if (statElevationEl) statElevationEl.innerHTML = `${totalElevationGain.toLocaleString()}<small>m</small>`;
    if (statPlannedEl) statPlannedEl.textContent = plannedCount;

    // 2. Render cards
    grid.innerHTML = '';
    mountains.forEach(m => {
      const article = document.createElement('article');

      let cardClass = 'idea';
      let badgeText = 'Someday';
      if (m.status === 'climbed') {
        cardClass = 'climbed';
        badgeText = 'Climbed';
      } else if (m.status === 'planning') {
        cardClass = 'planned';
        badgeText = 'Planning';
      }

      article.className = `card ${cardClass} reveal-on-scroll`;
      article.dataset.status = m.status;

      article.innerHTML = `
        <div class="card-badge">${badgeText}</div>
        <h3>${m.name}</h3>
        <p class="meta">${m.location} · ${m.elevation.toLocaleString()} m</p>
        <p>${m.description}</p>
      `;

      grid.appendChild(article);
      observer.observe(article);
    });

    // 3. Setup client-side filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Toggle active button class
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        const cards = grid.querySelectorAll('.card');

        cards.forEach(card => {
          // Map database 'planning' status or others to the button filter dataset
          if (filter === 'all' || card.dataset.status === filter) {
            card.classList.remove('hidden');
            // Re-observe the card to trigger animation if it becomes visible
            observer.observe(card);
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });

  } catch (error) {
    console.error('Error loading mountains database:', error);
  }
}

loadMountains();