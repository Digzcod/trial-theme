/**
 * Collection Filters JavaScript
 * Handles filtering functionality for collection pages
 */

(function () {
  "use strict";

  // Initialize when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeFilters);
  } else {
    initializeFilters();
  }

  function initializeFilters() {
    const filtersContainer = document.querySelector("collection-filters");
    if (!filtersContainer) return;

    // The custom element handles all the functionality
    // This file provides additional utilities if needed

    // Listen for filter updates
    document.addEventListener("collection-filters:update", handleFilterUpdate);
  }

  function handleFilterUpdate(event) {
    const { filters, params } = event.detail;

    // Update collection products (if needed)
    updateCollectionProducts(params);

    // Track analytics (if needed)
    trackFilterUsage(filters);
  }

  function updateCollectionProducts(params) {
    // This would integrate with collection product loading
    // For now, just update the URL
    console.log("Filters updated:", params.toString());
  }

  function trackFilterUsage(filters) {
    // Track filter usage for analytics
    if (window.gtag) {
      filters.forEach((typeFilters, type) => {
        typeFilters.forEach((filterData, value) => {
          window.gtag("event", "filter_used", {
            filter_type: type,
            filter_value: value,
          });
        });
      });
    }
  }
})();
