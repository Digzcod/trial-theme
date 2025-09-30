document.addEventListener("DOMContentLoaded", () => {
  // Initialize all carousels on the page
  const carousels = document.querySelectorAll('[id^="hc-"]');

  carousels.forEach((carousel) => {
    initializeCarousel(carousel);
  });
});

function initializeCarousel(carousel) {
  if (!carousel) return;

  const sectionId = carousel.id.replace("hc-", "");
  const originalSlides = [...carousel.children];
  const dotsContainer = carousel.parentElement.querySelector(".hc-dots");
  const prevButton = carousel.parentElement.querySelector(".hc-prev");
  const nextButton = carousel.parentElement.querySelector(".hc-next");
  const statusElement = document.getElementById(`carousel-status-${sectionId}`);

  // Create infinite loop by cloning slides
  let slides = [...originalSlides];
  let totalSlides = slides.length;
  let currentSlide = 0;
  let isTransitioning = false;
  let isAutoplayRunning = carousel.dataset.autoplay === "true";
  let autoplayTimer = null;
  let isUserInteracting = false;

  // Only create infinite loop if we have more than 1 slide
  if (totalSlides > 1) {
    // Clone first slide and append to end
    const firstClone = originalSlides[0].cloneNode(true);
    firstClone.setAttribute("aria-hidden", "true");
    firstClone.classList.add("hc-clone");
    carousel.appendChild(firstClone);

    // Clone last slide and prepend to beginning
    const lastClone = originalSlides[totalSlides - 1].cloneNode(true);
    lastClone.setAttribute("aria-hidden", "true");
    lastClone.classList.add("hc-clone");
    carousel.insertBefore(lastClone, originalSlides[0]);

    // Update slides array to include clones
    slides = [...carousel.children];

    // Start at slide 1 (first real slide, after the last clone)
    currentSlide = 1;
    carousel.scrollLeft = carousel.clientWidth * currentSlide;
  }

  // Respect user's motion preferences
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const animationDuration = prefersReducedMotion ? 0 : 500;

  // Custom smooth scroll function with better easing
  const smoothScrollTo = (targetPosition, duration = animationDuration) => {
    if (duration === 0 || prefersReducedMotion) {
      carousel.scrollLeft = targetPosition;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const startPosition = carousel.scrollLeft;
      const distance = targetPosition - startPosition;
      const startTime = performance.now();

      // Easing function for smoother animation (ease-out-cubic)
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        carousel.scrollLeft = startPosition + distance * easedProgress;

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animateScroll);
    });
  };

  // Navigate to specific slide with infinite loop support
  const goToSlide = (slideIndex, updateFocus = false, immediate = false) => {
    if (isTransitioning) return;

    isTransitioning = true;
    const targetPosition = carousel.clientWidth * slideIndex;
    currentSlide = slideIndex;

    const duration = immediate ? 0 : animationDuration;

    smoothScrollTo(targetPosition, duration).then(() => {
      // Handle infinite loop transitions
      if (totalSlides > 1) {
        if (currentSlide === 0) {
          // We're at the last clone, jump to the real last slide
          currentSlide = totalSlides;
          carousel.scrollLeft = carousel.clientWidth * currentSlide;
        } else if (currentSlide === slides.length - 1) {
          // We're at the first clone, jump to the real first slide
          currentSlide = 1;
          carousel.scrollLeft = carousel.clientWidth * currentSlide;
        }
      }

      updateUI();
      if (updateFocus && slides[currentSlide]) {
        slides[currentSlide].focus();
      }

      setTimeout(() => {
        isTransitioning = false;
      }, 50);
    });
  };

  // Navigate to next slide
  const nextSlide = () => {
    if (totalSlides <= 1) return;

    const nextIndex = currentSlide + 1;
    goToSlide(nextIndex);
  };

  // Navigate to previous slide
  const prevSlide = () => {
    if (totalSlides <= 1) return;

    const prevIndex = currentSlide - 1;
    goToSlide(prevIndex);
  };

  // Get the real slide index (excluding clones)
  const getRealSlideIndex = () => {
    if (totalSlides <= 1) return 0;

    let realIndex = currentSlide - 1;
    if (realIndex < 0) realIndex = totalSlides - 1;
    if (realIndex >= totalSlides) realIndex = 0;
    return realIndex;
  };

  // Update UI elements
  const updateUI = () => {
    updateActiveDot();
    updateArrows();
    updateStatus();
  };

  // Update status for screen readers
  const updateStatus = () => {
    if (statusElement) {
      const statusTemplate =
        statusElement.dataset.statusTemplate ||
        "Slide CURRENT_PLACEHOLDER of TOTAL_PLACEHOLDER";
      const realIndex = getRealSlideIndex();
      const statusText = statusTemplate
        .replace("CURRENT_PLACEHOLDER", realIndex + 1)
        .replace("TOTAL_PLACEHOLDER", totalSlides);
      statusElement.textContent = statusText;
    }
  };

  // Initialize dot navigation
  if (dotsContainer && totalSlides > 1) {
    // Create dots for original slides only
    for (let i = 0; i < totalSlides; i++) {
      const dotButton = document.createElement("button");
      dotButton.type = "button";
      dotButton.setAttribute("role", "tab");
      dotButton.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dotButton.setAttribute("aria-controls", carousel.id);
      dotButton.addEventListener("click", () => {
        // Navigate to the real slide (accounting for the clone at the beginning)
        goToSlide(i + 1);
        pauseAutoplay();
      });
      dotsContainer.appendChild(dotButton);
    }
  }

  // Update active dot indicator
  const updateActiveDot = () => {
    if (!dotsContainer) return;

    const dots = [...dotsContainer.children];
    const realIndex = getRealSlideIndex();

    dots.forEach((dot, index) => {
      const isActive = index === realIndex;
      dot.setAttribute("aria-current", isActive ? "true" : "false");
      dot.setAttribute("aria-selected", isActive ? "true" : "false");
      dot.setAttribute("tabindex", isActive ? "0" : "-1");
    });
  };

  // Update arrow button states
  const updateArrows = () => {
    if (prevButton) {
      prevButton.disabled = totalSlides <= 1;
      prevButton.setAttribute("aria-disabled", prevButton.disabled);
    }
    if (nextButton) {
      nextButton.disabled = totalSlides <= 1;
      nextButton.setAttribute("aria-disabled", nextButton.disabled);
    }
  };

  // Listen for scroll events with throttling
  let scrollTimeout;
  carousel.addEventListener("scroll", () => {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(() => {
      if (!isUserInteracting && !isTransitioning) {
        const newSlideIndex = Math.round(
          carousel.scrollLeft / carousel.clientWidth
        );
        if (newSlideIndex !== currentSlide) {
          currentSlide = newSlideIndex;
          updateUI();
        }
      }
    });
  });

  // Arrow navigation
  if (prevButton) {
    prevButton.addEventListener("click", () => {
      prevSlide();
      pauseAutoplay();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      nextSlide();
      pauseAutoplay();
    });
  }

  // Keyboard navigation
  carousel.addEventListener("keydown", (e) => {
    let handled = false;

    switch (e.key) {
      case "ArrowLeft":
        prevSlide();
        handled = true;
        break;
      case "ArrowRight":
        nextSlide();
        handled = true;
        break;
      case "Home":
        goToSlide(1, true); // Go to first real slide
        handled = true;
        break;
      case "End":
        goToSlide(totalSlides, true); // Go to last real slide
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      pauseAutoplay();
    }
  });

  // Autoplay functionality
  const startAutoplay = () => {
    if (totalSlides <= 1 || carousel.dataset.autoplay !== "true") return;

    isAutoplayRunning = true;

    const autoplayInterval = parseInt(carousel.dataset.autoplayMs) || 5000;
    autoplayTimer = setInterval(() => {
      nextSlide();
    }, autoplayInterval);
  };

  const pauseAutoplay = () => {
    isAutoplayRunning = false;

    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  // Pause on user interaction
  const pauseOnInteraction = () => {
    pauseAutoplay();
    isUserInteracting = true;
    setTimeout(() => {
      isUserInteracting = false;
    }, 1000);
  };

  carousel.addEventListener("mouseenter", pauseAutoplay);
  carousel.addEventListener("focusin", pauseAutoplay);
  carousel.addEventListener("touchstart", pauseOnInteraction, {
    passive: true,
  });

  // Resume autoplay when appropriate
  carousel.addEventListener("mouseleave", () => {
    if (carousel.dataset.autoplay === "true" && !isUserInteracting) {
      setTimeout(startAutoplay, 1000);
    }
  });

  carousel.addEventListener("focusout", () => {
    if (carousel.dataset.autoplay === "true" && !isUserInteracting) {
      setTimeout(startAutoplay, 1000);
    }
  });

  // Improved touch/swipe experience
  let startX = 0;
  let scrollStartLeft = 0;
  let isDragging = false;
  let startTime = 0;

  carousel.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      scrollStartLeft = carousel.scrollLeft;
      isDragging = true;
      startTime = Date.now();
      isUserInteracting = true;
    },
    { passive: true }
  );

  carousel.addEventListener(
    "touchmove",
    (e) => {
      if (!isDragging) return;

      const currentX = e.touches[0].clientX;
      const diffX = startX - currentX;
      carousel.scrollLeft = scrollStartLeft + diffX;
    },
    { passive: true }
  );

  carousel.addEventListener("touchend", (e) => {
    if (!isDragging) return;
    isDragging = false;

    const endTime = Date.now();
    const duration = endTime - startTime;
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    const velocity = Math.abs(diffX) / duration;

    // Determine if it's a swipe (fast movement) or just a drag
    if (velocity > 0.5 && Math.abs(diffX) > 50) {
      // Swipe detected
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    } else {
      // Just snap to nearest slide
      const newSlideIndex = Math.round(
        carousel.scrollLeft / carousel.clientWidth
      );
      goToSlide(newSlideIndex);
    }

    setTimeout(() => {
      isUserInteracting = false;
    }, 500);
  });

  // Handle visibility change (pause when tab is not visible)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAutoplay();
    } else if (carousel.dataset.autoplay === "true" && !isUserInteracting) {
      setTimeout(startAutoplay, 1000);
    }
  });

  // Initialize
  updateUI();
  if (carousel.dataset.autoplay === "true" && totalSlides > 1) {
    startAutoplay();
  }
}
