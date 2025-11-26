/**
 * Custom Badge Colors Script
 * This script applies custom background and text colors to product badges
 * based on the text content matching the theme settings.
 * 
 * Features:
 * - Supports multi-language badges via comma-separated text variations
 * - Case-insensitive matching
 * - Works with dynamically loaded content
 */

(function() {
  'use strict';

  // Function to parse comma-separated text variations into an array
  function parseTextVariations(textString) {
    if (!textString) return [];
    return textString
      .split(',')
      .map(text => text.trim().toLowerCase())
      .filter(text => text.length > 0);
  }

  // Function to check if badge text matches any of the configured variations
  function matchesBadgeText(badgeText, textVariations) {
    const normalizedBadgeText = badgeText.trim().toLowerCase();
    return textVariations.some(variation => variation === normalizedBadgeText);
  }

  // Function to apply custom colors to badges
  function applyCustomBadgeColors() {
    // Get custom badge settings from theme variables
    const customBadges = window.themeVariables?.settings?.customBadges || [];
    
    // Exit early if no custom badges are configured
    if (customBadges.length === 0) {
      return;
    }

    // Parse text variations for each custom badge (only once)
    const parsedBadges = customBadges.map(badge => ({
      index: badge.index,
      variations: parseTextVariations(badge.textVariations)
    })).filter(badge => badge.variations.length > 0);

    // Exit if no valid badge configurations
    if (parsedBadges.length === 0) {
      return;
    }

    // Find all badge elements on the page
    const badges = document.querySelectorAll('.badge.badge--custom');
    
    badges.forEach(badge => {
      // Skip if already processed
      if (badge.hasAttribute('data-custom-badge-applied')) {
        return;
      }

      const badgeText = badge.textContent.trim();
      
      // Check if this badge text matches any of the custom badge settings
      parsedBadges.forEach(customBadge => {
        if (matchesBadgeText(badgeText, customBadge.variations)) {
          // Apply custom CSS variables for this specific badge
          badge.style.setProperty('background-color', `rgb(var(--custom-badge-${customBadge.index}-background))`);
          badge.style.setProperty('color', `rgb(var(--custom-badge-${customBadge.index}-text))`);
          badge.setAttribute('data-custom-badge-applied', customBadge.index);
        }
      });
    });
  }

  // Apply badge colors when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCustomBadgeColors);
  } else {
    applyCustomBadgeColors();
  }

  // Also apply to dynamically loaded content (e.g., AJAX-loaded products)
  // Using MutationObserver to detect new badges being added to the page
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        applyCustomBadgeColors();
      }
    });
  });

  // Start observing the document for changes
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
})();