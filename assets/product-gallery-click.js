// Make product gallery images clickable to open lightbox
(function() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Find all product galleries
    const galleries = document.querySelectorAll('product-gallery');
    
    galleries.forEach(gallery => {
      // Override the openLightBox method to properly find images inside open-lightbox-button
      const originalOpenLightBox = gallery.openLightBox;
      
      gallery.openLightBox = function(index) {
        const carousel = this.carousel;
        if (!carousel) return;
        
        // Find images - check both direct children and inside open-lightbox-button
        const images = carousel.cells.flatMap((cell) => {
          // Try direct children first
          let imgs = Array.from(cell.querySelectorAll(':scope > img'));
          // If not found, try inside open-lightbox-button
          if (imgs.length === 0) {
            imgs = Array.from(cell.querySelectorAll('open-lightbox-button img, :scope > img'));
          }
          return imgs;
        });
        
        const dataSource = images.map((image) => {
          return {
            thumbnailElement: image,
            src: image.src,
            srcset: image.srcset,
            msrc: image.currentSrc || image.src,
            width: parseInt(image.getAttribute("width")),
            height: parseInt(image.getAttribute("height")),
            alt: image.alt,
            thumbCropped: true
          };
        });
        
        const imageCells = carousel.cells.filter((cell) => cell.getAttribute("data-media-type") === "image" && !cell.hasAttribute('hidden'));
        this.lightBox.loadAndOpen(index ?? imageCells.indexOf(carousel.selectedCell), dataSource);
      };
      
      const carousel = gallery.querySelector('.product-gallery__carousel');
      if (!carousel) return;
      
      // Add click listener to carousel
      carousel.addEventListener('click', function(event) {
        // Check if click is inside an open-lightbox-button
        const lightboxButton = event.target.closest('open-lightbox-button');
        
        if (lightboxButton) {
          // Let the open-lightbox-button handle the click
          return;
        }
        
        // For carousel mode without open-lightbox-button wrapper
        // Check if we clicked on an image
        const mediaCell = event.target.closest('.product-gallery__media');
        if (mediaCell && mediaCell.getAttribute('data-media-type') === 'image') {
          // Get the index of the clicked image
          const allCells = Array.from(carousel.querySelectorAll('.product-gallery__media'));
          const imageCells = allCells.filter(cell => cell.getAttribute('data-media-type') === 'image' && !cell.hasAttribute('hidden'));
          const clickedIndex = imageCells.indexOf(mediaCell);
          
          if (clickedIndex >= 0) {
            // Dispatch lightbox open event
            gallery.dispatchEvent(new CustomEvent('lightbox:open', {
              bubbles: true,
              detail: { index: clickedIndex }
            }));
          }
        }
      }, { capture: false });
    });
  }
  
  // Re-initialize on dynamic content changes
  document.addEventListener('shopify:section:load', init);
})();