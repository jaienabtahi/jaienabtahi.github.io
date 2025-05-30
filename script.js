document.addEventListener("DOMContentLoaded", () => {
  // Counter Animation
  const animateCounters = (counter) => {
    const target = +counter.getAttribute("data-target");
    let current = 0; // Animation always starts counting from 0

    // Determine initial display text with symbol based on classes
    let initialDisplayValue = "0";
    if (counter.classList.contains('count-percent')) {
        initialDisplayValue += '%';
    } else if (counter.classList.contains('add-percent')) {
        initialDisplayValue += '+';
    }
    counter.innerText = initialDisplayValue;

    // If the target is 0, it's already set correctly, so no animation needed.
    if (target === 0) {
        return;
    }

    const duration = 1500; // milliseconds for the counter animation
    const frameRate = 60; // fps
    const totalFrames = Math.round(duration / (1000 / frameRate));
    let increment = target / totalFrames;

    // Ensure increment is at least 1 if target > 0, to prevent infinite loops if target is small
    if (increment === 0 && target > 0) increment = 1;

    const updateCount = () => {
      current += increment;
      let numValue;

      if (current < target) {
        numValue = Math.ceil(current);
      } else {
        numValue = target; // Ensure it ends exactly on target
      }

      // Construct the display text with the number and appropriate symbol
      let displayText = numValue.toString();
      if (counter.classList.contains('count-percent')) {
        displayText += '%';
      } else if (counter.classList.contains('add-percent')) {
        displayText += '+';
      }
      // If no specific class, it remains just the number (e.g., for Years Established)

      counter.innerText = displayText;

      if (current < target) {
        requestAnimationFrame(updateCount); // Continue animation
      }
    };
    requestAnimationFrame(updateCount); // Start the animation
  };

  const statsSection = document.getElementById("stats");
  if (statsSection) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const statCounters = entry.target.querySelectorAll(".count");
            statCounters.forEach(counter => {
                if (!counter.hasAnimated) {
                    animateCounters(counter);
                    counter.hasAnimated = true; // Mark as animated
                }
            });
          }
        });
      },
      { threshold: 0.3 } // Trigger when 30% of the element is visible
    );
    statsObserver.observe(statsSection);
  }

  // Hero Video Autoplay on Intersection
  const video = document.getElementById("hero-video");
  if (video) {
    // let isPlaying = false; // isPlaying wasn't used, can be removed if not needed elsewhere
    const videoContainer = document.querySelector(".hero-video");

    if (videoContainer) {
        const videoObserver = new IntersectionObserver(
            (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                if (video.paused) { // Simpler check: if it's paused and intersecting, play
                    // video.currentTime = 0; // Optional: restart video
                    video.play().then(() => {
                        // isPlaying = true;
                    }).catch(error => {
                        console.info("Video autoplay prevented:", error.message);
                        // Browser might require user interaction.
                    });
                }
                } else {
                if (!video.paused) { // If not intersecting and playing, pause
                    video.pause();
                    // isPlaying = false;
                }
                }
            });
            },
            { threshold: 0.5 } // Trigger when 50% of the video container is visible
        );
        videoObserver.observe(videoContainer);
    }
  }

  // General Scroll Animation for Sections
  const animatedItems = document.querySelectorAll(".animate-on-scroll");
  if (animatedItems.length > 0) {
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.15 } // Trigger when 15% of the element is visible
    );
    animatedItems.forEach((el) => scrollObserver.observe(el));
  }

  // --- Project Slider Logic ---
  const track = document.querySelector(".project-track");
  const cards = document.querySelectorAll(".project-card");
  const slider = document.querySelector(".project-slider");

  let hoveredCardDuringPause = null; // To store the card hovered while animation is paused

  function updateActiveCard() {
    if (!slider || !cards || cards.length === 0) return; // Added !cards check

    const isAnimationPaused = track && getComputedStyle(track).animationPlayState === 'paused';

    // If animation is paused AND a card was specifically hovered during this pause,
    // make that hovered card the active one.
    if (isAnimationPaused && hoveredCardDuringPause) {
      cards.forEach(card => {
        if (card.offsetParent === null) { // Ensure card is visible (not display:none)
          card.classList.remove("active");
          return;
        }
        if (card === hoveredCardDuringPause) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
      });
      return; // Don't do center detection
    }

    // --- Default center-detection logic (when animation is running or no specific card was hovered during pause) ---
    const sliderRect = slider.getBoundingClientRect();
    const sliderCenter = sliderRect.left + sliderRect.width / 2;
    let minDistance = Infinity;
    let autoActiveCard = null;

    cards.forEach((card) => {
      if (card.offsetParent === null) { // Card is not visible (e.g., filtered out)
        card.classList.remove("active");
        return;
      }
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - sliderCenter);

      // Card is a candidate if its center is within half its width from slider center
      if (distance < cardRect.width / 2 && distance < minDistance) {
        minDistance = distance;
        autoActiveCard = card;
      }
    });

    cards.forEach(card => {
      if (card.offsetParent === null) { // Double check visibility
        card.classList.remove("active");
        return;
      }
      if (card === autoActiveCard) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });
  }

  if (slider && track && cards.length > 0) { // Made condition more robust
    updateActiveCard(); // Initial call
    window.addEventListener('resize', updateActiveCard, { passive: true });

    let lastTrackPosition = 0;
    function checkTrackScroll() {
      if (track) {
        const currentTransform = getComputedStyle(track).transform;
        if (currentTransform !== 'none') {
          const matrix = new DOMMatrixReadOnly(currentTransform);
          const currentX = matrix.m41;
          const currentAnimationState = getComputedStyle(track).animationPlayState;

          if (currentX !== lastTrackPosition && currentAnimationState === 'running') {
             hoveredCardDuringPause = null; // Reset if animation is running
             updateActiveCard();
             lastTrackPosition = currentX;
          }
          // No 'else if' needed here for paused state related to card hover;
          // The card's own mouseenter will trigger updateActiveCard if needed.
        }
      }
      requestAnimationFrame(checkTrackScroll);
    }
    requestAnimationFrame(checkTrackScroll);

    // Add hover listeners to individual cards
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        // When a card is hovered, if the main slider animation is paused (due to .project-slider:hover CSS)
        // then we set this card as the one to make active.
        if (track && getComputedStyle(track).animationPlayState === 'paused') {
          hoveredCardDuringPause = card;
          updateActiveCard(); // This will now use hoveredCardDuringPause
        }
        // The card's own :hover CSS will make it visually larger/clearer immediately.
      });
    });

    // When the mouse leaves the entire slider area, the CSS :hover on .project-slider is removed,
    // and the animationPlayState becomes 'running'.
    // We need to ensure our JS state reflects this.
    slider.addEventListener('mouseleave', () => {
        hoveredCardDuringPause = null; // No specific card is being targeted by hover anymore
        // The checkTrackScroll will pick this up naturally as animation resumes
        // and call updateActiveCard if needed.
    });
  }


  // Project Filter Logic
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCardsAll = document.querySelectorAll(".project-card"); // Keep a reference to all cards

  if (filterButtons.length > 0 && projectCardsAll.length > 0) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        const filter = button.getAttribute("data-filter");

        projectCardsAll.forEach((card) => {
          const category = card.getAttribute("data-category");
          if (filter === "all" || category === filter) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
        });

        // After filtering, reset any specific hover focus and update active card
        hoveredCardDuringPause = null; // Reset any specific card hover focus

        if (track) {
            // Determine if animation was paused by user hovering the slider
            const wasSliderHoverPaused = getComputedStyle(track).animationPlayState === 'paused';

            // Always pause for filtering re-layout
            track.style.animationPlayState = 'paused';

            setTimeout(() => {
                // Only resume animation if it wasn't paused by a user hover on the slider
                // (i.e., if it was running before we paused it for filtering)
                if (!wasSliderHoverPaused) {
                    track.style.animationPlayState = 'running';
                }
                updateActiveCard(); // Update active card based on new filtered set
            }, 50); // Short delay for re-layout
        } else {
            updateActiveCard(); // Call even if track doesn't exist (e.g. if all cards filtered out)
        }
      });
    });
  }
});