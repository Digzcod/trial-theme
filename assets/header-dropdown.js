/**
 * Header Dropdown Navigation Component
 * Handles dropdown menu interactions with keyboard navigation and accessibility
 */
class HeaderDropdown extends HTMLElement {
  constructor() {
    super();
    this.dropdown = this.querySelector("[data-dropdown]");
    this.trigger = this.querySelector(".nav-dropdown__trigger");
    this.menu = this.querySelector(".nav-dropdown__menu");
    this.menuItems = this.querySelectorAll('[role="menuitem"]');
    this.isOpen = false;
    this.currentIndex = -1;

    this.#init();
  }

  #init() {
    if (!this.trigger || !this.menu) return;

    this.#bindEvents();
    this.#setupAccessibility();
  }

  #bindEvents() {
    // Click events
    this.trigger.addEventListener("click", this.#handleTriggerClick.bind(this));
    document.addEventListener("click", this.#handleDocumentClick.bind(this));

    // Keyboard events
    this.trigger.addEventListener(
      "keydown",
      this.#handleTriggerKeydown.bind(this)
    );
    this.menu.addEventListener("keydown", this.#handleMenuKeydown.bind(this));

    // Focus events for better UX
    this.addEventListener("focusout", this.#handleFocusOut.bind(this));
  }

  #setupAccessibility() {
    // Generate unique IDs for ARIA relationships
    const menuId = `dropdown-menu-${Math.random().toString(36).substr(2, 9)}`;
    this.menu.id = menuId;
    this.trigger.setAttribute("aria-controls", menuId);

    // Set initial ARIA states
    this.trigger.setAttribute("aria-expanded", "false");
    this.menu.setAttribute("aria-hidden", "true");
  }

  #handleTriggerClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isOpen) {
      this.#closeDropdown();
    } else {
      this.#openDropdown();
    }
  }

  #handleDocumentClick(event) {
    if (!this.contains(event.target)) {
      this.#closeDropdown();
    }
  }

  #handleTriggerKeydown(event) {
    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        this.#openDropdown();
        this.#focusFirstMenuItem();
        break;
      case "ArrowDown":
        event.preventDefault();
        this.#openDropdown();
        this.#focusFirstMenuItem();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.#openDropdown();
        this.#focusLastMenuItem();
        break;
      case "Escape":
        this.#closeDropdown();
        break;
    }
  }

  #handleMenuKeydown(event) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.#focusNextMenuItem();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.#focusPreviousMenuItem();
        break;
      case "Home":
        event.preventDefault();
        this.#focusFirstMenuItem();
        break;
      case "End":
        event.preventDefault();
        this.#focusLastMenuItem();
        break;
      case "Escape":
        event.preventDefault();
        this.#closeDropdown();
        this.trigger.focus();
        break;
      case "Tab":
        // Let tab work naturally, but close dropdown
        this.#closeDropdown();
        break;
    }
  }

  #handleFocusOut(event) {
    // Small delay to check if focus moved to another element within dropdown
    setTimeout(() => {
      if (!this.contains(document.activeElement)) {
        this.#closeDropdown();
      }
    }, 10);
  }

  #openDropdown() {
    if (this.isOpen) return;

    // Close other open dropdowns
    document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
      if (dropdown !== this && dropdown.isOpen) {
        dropdown.closeDropdown();
      }
    });

    this.isOpen = true;
    this.currentIndex = -1;

    // Update ARIA states
    this.trigger.setAttribute("aria-expanded", "true");
    this.menu.setAttribute("aria-hidden", "false");

    // Show menu with animation
    this.menu.classList.remove("opacity-0", "invisible", "scale-95");
    this.menu.classList.add("opacity-100", "visible", "scale-100");

    // Add open class for styling
    this.classList.add("dropdown-open");
  }

  #closeDropdown() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.currentIndex = -1;

    // Update ARIA states
    this.trigger.setAttribute("aria-expanded", "false");
    this.menu.setAttribute("aria-hidden", "true");

    // Hide menu with animation
    this.menu.classList.remove("opacity-100", "visible", "scale-100");
    this.menu.classList.add("opacity-0", "invisible", "scale-95");

    // Remove open class
    this.classList.remove("dropdown-open");
  }

  #focusFirstMenuItem() {
    if (this.menuItems.length > 0) {
      this.currentIndex = 0;
      this.menuItems[0].focus();
    }
  }

  #focusLastMenuItem() {
    if (this.menuItems.length > 0) {
      this.currentIndex = this.menuItems.length - 1;
      this.menuItems[this.currentIndex].focus();
    }
  }

  #focusNextMenuItem() {
    if (this.menuItems.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.menuItems.length;
    this.menuItems[this.currentIndex].focus();
  }

  #focusPreviousMenuItem() {
    if (this.menuItems.length === 0) return;

    this.currentIndex =
      this.currentIndex <= 0
        ? this.menuItems.length - 1
        : this.currentIndex - 1;
    this.menuItems[this.currentIndex].focus();
  }

  // Public method to close dropdown (for external use)
  closeDropdown() {
    this.#closeDropdown();
  }
}

// Initialize functionality when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Register custom element if not already defined
  if (!customElements.get("header-dropdown")) {
    customElements.define("header-dropdown", HeaderDropdown);
  }

  // Initialize existing dropdowns
  document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
    if (!dropdown.upgraded) {
      Object.setPrototypeOf(dropdown, HeaderDropdown.prototype);
      HeaderDropdown.call(dropdown);
      dropdown.upgraded = true;
    }
  });

  // Initialize mobile menu (now from separate file)
  if (typeof MobileMenu !== "undefined") {
    new MobileMenu();
  }
});

// Handle dynamic content loading (for SPAs or AJAX)
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Element node
        const dropdowns = node.querySelectorAll
          ? node.querySelectorAll(".nav-dropdown")
          : [];
        dropdowns.forEach((dropdown) => {
          if (!dropdown.upgraded) {
            Object.setPrototypeOf(dropdown, HeaderDropdown.prototype);
            HeaderDropdown.call(dropdown);
            dropdown.upgraded = true;
          }
        });
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
