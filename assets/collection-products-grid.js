/**
 * Collection Products Grid JavaScript
 * Handles AJAX add to cart functionality and product interactions
 * Enterprise-level cart management with loading states and error handling
 */

class CollectionProductsGrid extends HTMLElement {
  constructor() {
    super();
    this.cart = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeCartHelpers();
  }

  setupEventListeners() {
    // Quick add to cart functionality
    this.addEventListener("submit", this.handleQuickAdd.bind(this));

    // Load more functionality
    const loadMoreButton = this.querySelector("[data-load-more]");
    if (loadMoreButton) {
      loadMoreButton.addEventListener("click", this.handleLoadMore.bind(this));
    }
  }

  async initializeCartHelpers() {
    try {
      // Initialize cart state
      this.cart = await this.fetchCart();
      this.updateCartIndicators();
    } catch (error) {
      console.warn("Failed to initialize cart helpers:", error);
    }
  }

  async handleQuickAdd(event) {
    if (!event.target.matches("[data-product-form]")) return;

    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector("[data-quick-add-button]");
    const productCard = form.closest(".product-card");

    if (!submitButton) return;

    try {
      this.setLoadingState(submitButton, true);

      const formData = new FormData(form);
      const response = await this.addToCart(formData);

      if (response.ok) {
        const result = await response.json();
        await this.handleAddToCartSuccess(result, productCard);
      } else {
        const error = await response.json();
        this.handleAddToCartError(error, submitButton);
      }
    } catch (error) {
      console.error("Add to cart failed:", error);
      this.handleAddToCartError(
        { message: "Network error occurred" },
        submitButton
      );
    } finally {
      this.setLoadingState(submitButton, false);
    }
  }

  async addToCart(formData) {
    return fetch("/cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: new URLSearchParams(formData),
    });
  }

  async fetchCart() {
    const response = await fetch("/cart.js");
    return response.json();
  }

  async handleAddToCartSuccess(result, productCard) {
    // Update cart state
    this.cart = await this.fetchCart();
    this.updateCartIndicators();

    // Show success feedback
    this.showSuccessFeedback(productCard);

    // Dispatch custom event for cart drawer or other components
    this.dispatchEvent(
      new CustomEvent("product:added-to-cart", {
        detail: {
          product: result,
          cart: this.cart,
        },
        bubbles: true,
      })
    );
  }

  handleAddToCartError(error, submitButton) {
    console.error("Add to cart error:", error);

    // Show error message
    this.showErrorFeedback(
      submitButton,
      error.message || "Failed to add item to cart"
    );

    // Dispatch error event
    this.dispatchEvent(
      new CustomEvent("product:add-to-cart-error", {
        detail: { error },
        bubbles: true,
      })
    );
  }

  setLoadingState(button, isLoading) {
    const textElement = button.querySelector(".quick-add-text");
    const loadingElement = button.querySelector(".quick-add-loading");

    if (isLoading) {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      if (textElement) textElement.classList.add("hidden");
      if (loadingElement) loadingElement.classList.remove("hidden");
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      if (textElement) textElement.classList.remove("hidden");
      if (loadingElement) loadingElement.classList.add("hidden");
    }
  }

  showSuccessFeedback(productCard) {
    // Create and show success indicator
    const successIndicator = document.createElement("div");
    successIndicator.className = "cart-success-indicator";
    successIndicator.innerHTML = `
      <div class="cart-success-content">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        <span>Added to cart</span>
      </div>
    `;

    productCard.appendChild(successIndicator);

    // Animate in
    requestAnimationFrame(() => {
      successIndicator.classList.add("show");
    });

    // Remove after delay
    setTimeout(() => {
      successIndicator.classList.remove("show");
      setTimeout(() => {
        if (successIndicator.parentNode) {
          successIndicator.parentNode.removeChild(successIndicator);
        }
      }, 300);
    }, 2000);
  }

  showErrorFeedback(button, message) {
    // Create error tooltip
    const existingError = button.parentNode.querySelector(
      ".cart-error-tooltip"
    );
    if (existingError) {
      existingError.remove();
    }

    const errorTooltip = document.createElement("div");
    errorTooltip.className = "cart-error-tooltip";
    errorTooltip.textContent = message;

    button.parentNode.appendChild(errorTooltip);

    // Show and auto-hide
    requestAnimationFrame(() => {
      errorTooltip.classList.add("show");
    });

    setTimeout(() => {
      errorTooltip.classList.remove("show");
      setTimeout(() => {
        if (errorTooltip.parentNode) {
          errorTooltip.parentNode.removeChild(errorTooltip);
        }
      }, 300);
    }, 3000);
  }

  updateCartIndicators() {
    // Update cart count in header if present
    const cartCountElements = document.querySelectorAll("[data-cart-count]");
    cartCountElements.forEach((element) => {
      element.textContent = this.cart ? this.cart.item_count : "0";
    });

    // Update cart total if present
    const cartTotalElements = document.querySelectorAll("[data-cart-total]");
    cartTotalElements.forEach((element) => {
      if (this.cart && this.cart.total_price) {
        element.textContent = this.formatMoney(this.cart.total_price);
      }
    });
  }

  formatMoney(cents) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }

  async handleLoadMore(event) {
    event.preventDefault();

    const button = event.target;
    const currentPage = parseInt(button.dataset.currentPage) || 1;
    const nextPage = currentPage + 1;

    try {
      button.disabled = true;
      button.textContent = "Loading...";

      const response = await fetch(
        `${window.location.pathname}?page=${nextPage}&section_id=${this.dataset.sectionId}`
      );
      const html = await response.text();

      // Parse and append new products
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const newProducts = doc.querySelectorAll(".product-card");

      if (newProducts.length > 0) {
        const grid = this.querySelector(".products-grid");
        newProducts.forEach((product) => {
          grid.appendChild(product);
        });

        button.dataset.currentPage = nextPage;
        button.textContent = "Load More";
        button.disabled = false;
      } else {
        // No more products
        button.style.display = "none";
      }
    } catch (error) {
      console.error("Load more failed:", error);
      button.textContent = "Try Again";
      button.disabled = false;
    }
  }
}

// Register the custom element
customElements.define("collection-products-grid", CollectionProductsGrid);

// CSS for JavaScript-generated elements
const style = document.createElement("style");
style.textContent = `
  .cart-success-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(34, 197, 94, 0.95);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 10;
    pointer-events: none;
  }

  .cart-success-indicator.show {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(-8px);
  }

  .cart-success-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cart-error-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239, 68, 68, 0.95);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 10;
    margin-bottom: 8px;
  }

  .cart-error-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(239, 68, 68, 0.95);
  }

  .cart-error-tooltip.show {
    opacity: 1;
    transform: translateX(-50%) translateY(-4px);
  }

  /* Loading states */
  [aria-busy="true"] {
    cursor: wait;
    opacity: 0.7;
  }

  .quick-add-loading {
    display: inline-flex !important;
    align-items: center;
    gap: 4px;
  }

  .quick-add-loading::after {
    content: '';
    width: 12px;
    height: 12px;
    border: 2px solid currentColor;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive adjustments */
  @media screen and (max-width: 768px) {
    .cart-success-indicator {
      font-size: 0.8rem;
      padding: 10px 14px;
    }
    
    .cart-error-tooltip {
      font-size: 0.7rem;
      padding: 6px 10px;
    }
  }
`;

document.head.appendChild(style);

// Initialize all collection grid instances
document.addEventListener("DOMContentLoaded", () => {
  const grids = document.querySelectorAll(".collection-products-grid");
  grids.forEach((grid) => {
    if (!grid.tagName.includes("-")) {
      // Upgrade existing elements
      const wrapper = document.createElement("collection-products-grid");
      grid.parentNode.insertBefore(wrapper, grid);
      wrapper.appendChild(grid);
    }
  });
});

export default CollectionProductsGrid;
