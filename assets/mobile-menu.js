/**
 * Professional Mobile Menu Handler
 * Handles slide-in mobile navigation modal with smooth animations
 */
class MobileMenu {
  constructor() {
    this.menuButton = document.getElementById("mobile-menu-button");
    this.mobileMenu = document.getElementById("mobile-menu");
    this.menuIcon = this.menuButton?.querySelector(".mobile-menu-button__icon");
    this.closeIcon = this.menuButton?.querySelector(
      ".mobile-menu-button__close"
    );
    this.modalCloseBtn = this.mobileMenu?.querySelector(".mobile-menu-close");
    this.backdrop = this.mobileMenu?.querySelector(".mobile-menu-backdrop");
    this.isOpen = false;

    this.#init();
  }

  #init() {
    if (!this.menuButton || !this.mobileMenu) return;

    this.#bindEvents();
    this.#setupInitialState();
  }

  #setupInitialState() {
    // Ensure initial state is correct
    this.mobileMenu.classList.add("hidden");
    this.mobileMenu.setAttribute("aria-hidden", "true");
    this.menuButton.setAttribute("aria-expanded", "false");
  }

  #bindEvents() {
    // Main menu button toggle
    this.menuButton.addEventListener(
      "click",
      this.#toggleMobileMenu.bind(this)
    );

    // Modal close button
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener(
        "click",
        this.#closeMobileMenu.bind(this)
      );
    }

    // Backdrop click to close
    if (this.backdrop) {
      this.backdrop.addEventListener("click", this.#closeMobileMenu.bind(this));
    }

    // Close mobile menu on escape key
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isOpen) {
        this.#closeMobileMenu();
      }
    });

    // Handle window resize - close menu if screen becomes large
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768 && this.isOpen) {
        this.#closeMobileMenu();
      }
    });
  }

  #toggleMobileMenu() {
    if (this.isOpen) {
      this.#closeMobileMenu();
    } else {
      this.#openMobileMenu();
    }
  }

  #openMobileMenu() {
    this.isOpen = true;

    // Show modal
    this.mobileMenu.classList.remove("hidden");
    this.mobileMenu.setAttribute("aria-hidden", "false");
    this.menuButton.setAttribute("aria-expanded", "true");

    // Toggle button icons
    if (this.menuIcon && this.closeIcon) {
      this.menuIcon.classList.add("hidden");
      this.closeIcon.classList.remove("hidden");
    }

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    // Focus management - focus on close button for accessibility
    setTimeout(() => {
      if (this.modalCloseBtn) {
        this.modalCloseBtn.focus();
      }
    }, 300);
  }

  #closeMobileMenu() {
    this.isOpen = false;

    // Hide modal with animation
    this.mobileMenu.classList.add("hidden");
    this.mobileMenu.setAttribute("aria-hidden", "true");
    this.menuButton.setAttribute("aria-expanded", "false");

    // Toggle button icons
    if (this.menuIcon && this.closeIcon) {
      this.menuIcon.classList.remove("hidden");
      this.closeIcon.classList.add("hidden");
    }

    // Restore body scroll
    document.body.style.overflow = "";

    // Close all mobile dropdowns using the new enhanced dropdown system
    if (window.MobileDropdown) {
      window.MobileDropdown.closeAll();
    }

    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent("mobile-menu:close"));

    // Return focus to menu button
    this.menuButton.focus();
  }
}

// Initialize mobile menu when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new MobileMenu();
});

// Ensure initialization even if script loads after DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new MobileMenu();
  });
} else {
  new MobileMenu();
}
