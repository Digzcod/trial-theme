/**
 * Enhanced Mobile Dropdown Component
 * Provides accessible mobile dropdown functionality with keyboard navigation
 * Works in coordination with mobile menu system
 */
class MobileDropdown {
  constructor(element) {
    this.dropdown = element;
    this.trigger = this.dropdown.querySelector(".mobile-dropdown__trigger");
    this.menu = this.dropdown.querySelector(".mobile-dropdown__menu");
    this.links = this.dropdown.querySelectorAll(".mobile-dropdown__link");
    this.isOpen = false;
    this.currentFocusIndex = -1;

    this.#init();
  }

  #init() {
    if (!this.trigger || !this.menu) return;

    this.#setupAccessibility();
    this.#bindEvents();
  }

  #setupAccessibility() {
    // Generate unique IDs for ARIA relationships
    const menuId = `mobile-dropdown-${Math.random().toString(36).substr(2, 9)}`;
    this.menu.id = menuId;
    this.trigger.setAttribute("aria-controls", menuId);
    this.trigger.setAttribute("aria-expanded", "false");
    this.menu.setAttribute("aria-hidden", "true");

    // Add role attributes for better screen reader support
    this.menu.setAttribute("role", "menu");
    this.links.forEach((link) => {
      link.setAttribute("role", "menuitem");
      link.setAttribute("tabindex", "-1");
    });
  }

  #bindEvents() {
    // Click events
    this.trigger.addEventListener("click", this.#handleTriggerClick.bind(this));

    // Keyboard events for accessibility
    this.trigger.addEventListener(
      "keydown",
      this.#handleTriggerKeydown.bind(this)
    );
    this.menu.addEventListener("keydown", this.#handleMenuKeydown.bind(this));

    // Touch events for better mobile interaction
    this.trigger.addEventListener(
      "touchstart",
      this.#handleTouchStart.bind(this),
      { passive: true }
    );
  }

  #handleTriggerClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.toggle();
  }

  #handleTouchStart(event) {
    // Improve touch responsiveness
    this.trigger.style.transform = "scale(0.95)";
    setTimeout(() => {
      this.trigger.style.transform = "";
    }, 150);
  }

  #handleTriggerKeydown(event) {
    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        this.open();
        this.#focusFirstLink();
        break;
      case "ArrowDown":
        event.preventDefault();
        this.open();
        this.#focusFirstLink();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.open();
        this.#focusLastLink();
        break;
      case "Escape":
        this.close();
        break;
    }
  }

  #handleMenuKeydown(event) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.#focusNextLink();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.#focusPreviousLink();
        break;
      case "Home":
        event.preventDefault();
        this.#focusFirstLink();
        break;
      case "End":
        event.preventDefault();
        this.#focusLastLink();
        break;
      case "Escape":
        event.preventDefault();
        this.close();
        this.trigger.focus();
        break;
      case "Tab":
        // Allow natural tab behavior but close dropdown
        this.close();
        break;
    }
  }

  #focusFirstLink() {
    if (this.links.length > 0) {
      this.currentFocusIndex = 0;
      this.links[0].focus();
    }
  }

  #focusLastLink() {
    if (this.links.length > 0) {
      this.currentFocusIndex = this.links.length - 1;
      this.links[this.currentFocusIndex].focus();
    }
  }

  #focusNextLink() {
    if (this.links.length === 0) return;

    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.links.length;
    this.links[this.currentFocusIndex].focus();
  }

  #focusPreviousLink() {
    if (this.links.length === 0) return;

    this.currentFocusIndex =
      this.currentFocusIndex <= 0
        ? this.links.length - 1
        : this.currentFocusIndex - 1;
    this.links[this.currentFocusIndex].focus();
  }

  open() {
    if (this.isOpen) return;

    // Close other mobile dropdowns
    this.#closeOtherDropdowns();

    this.isOpen = true;
    this.currentFocusIndex = -1;

    // Update ARIA states
    this.trigger.setAttribute("aria-expanded", "true");
    this.menu.setAttribute("aria-hidden", "false");

    // Add CSS classes for styling
    this.menu.classList.add("expanded");
    this.dropdown.classList.add("dropdown-open");

    // Force icon rotation with specific class
    const icon = this.trigger.querySelector(".mobile-dropdown__icon");
    if (icon) {
      icon.classList.add("rotated");
    }

    // Debug: Log that dropdown is opening
    console.log(
      "Mobile dropdown opening:",
      this.dropdown.classList.contains("dropdown-open")
    );

    // Enable focus for menu items
    this.links.forEach((link) => {
      link.setAttribute("tabindex", "0");
    });

    // Dispatch custom event for other components
    this.dropdown.dispatchEvent(
      new CustomEvent("mobile-dropdown:open", {
        bubbles: true,
        detail: { dropdown: this },
      })
    );
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.currentFocusIndex = -1;

    // Update ARIA states
    this.trigger.setAttribute("aria-expanded", "false");
    this.menu.setAttribute("aria-hidden", "true");

    // Remove CSS classes
    this.menu.classList.remove("expanded");
    this.dropdown.classList.remove("dropdown-open");

    // Remove icon rotation class
    const icon = this.trigger.querySelector(".mobile-dropdown__icon");
    if (icon) {
      icon.classList.remove("rotated");
    }

    // Debug: Log that dropdown is closing
    console.log(
      "Mobile dropdown closing:",
      this.dropdown.classList.contains("dropdown-open")
    );

    // Disable focus for menu items
    this.links.forEach((link) => {
      link.setAttribute("tabindex", "-1");
    });

    // Dispatch custom event for other components
    this.dropdown.dispatchEvent(
      new CustomEvent("mobile-dropdown:close", {
        bubbles: true,
        detail: { dropdown: this },
      })
    );
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  #closeOtherDropdowns() {
    document.querySelectorAll("[data-mobile-dropdown]").forEach((dropdown) => {
      if (dropdown !== this.dropdown && dropdown.mobileDropdownInstance) {
        dropdown.mobileDropdownInstance.close();
      }
    });
  }

  // Public method to close all dropdowns (used by mobile menu)
  static closeAll() {
    document.querySelectorAll("[data-mobile-dropdown]").forEach((dropdown) => {
      if (dropdown.mobileDropdownInstance) {
        dropdown.mobileDropdownInstance.close();
      }
    });
  }
}

/**
 * Mobile Dropdown Manager
 * Handles initialization and coordination of all mobile dropdowns
 */
class MobileDropdownManager {
  constructor() {
    this.dropdowns = new Map();
    this.#init();
  }

  #init() {
    this.#initializeDropdowns();
    this.#bindGlobalEvents();
  }

  #initializeDropdowns() {
    document.querySelectorAll("[data-mobile-dropdown]").forEach((element) => {
      const instance = new MobileDropdown(element);
      this.dropdowns.set(element, instance);
      element.mobileDropdownInstance = instance;
    });
  }

  #bindGlobalEvents() {
    // Close dropdowns when mobile menu closes
    document.addEventListener("mobile-menu:close", () => {
      MobileDropdown.closeAll();
    });

    // Handle orientation change
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        MobileDropdown.closeAll();
      }, 100);
    });

    // Close dropdowns on window resize if screen becomes large
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) {
        MobileDropdown.closeAll();
      }
    });
  }

  // Public method to reinitialize dropdowns (useful for dynamic content)
  reinitialize() {
    this.dropdowns.clear();
    this.#initializeDropdowns();
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new MobileDropdownManager();
});

// Ensure initialization even if script loads after DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new MobileDropdownManager();
  });
} else {
  new MobileDropdownManager();
}

// Export for potential use in other modules
window.MobileDropdown = MobileDropdown;
window.MobileDropdownManager = MobileDropdownManager;
