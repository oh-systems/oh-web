// Emergency cursor hiding script - runs immediately
(function() {
  'use strict';
  
  // Function to aggressively hide cursor
  function hideCursor() {
    // Add styles to document
    const style = document.createElement('style');
    style.id = 'emergency-cursor-hide';
    style.innerHTML = `
      /* EMERGENCY CURSOR HIDING - MAXIMUM PRIORITY */
      *, *::before, *::after,
      html, body, div, span, p, h1, h2, h3, h4, h5, h6,
      a, button, input, textarea, select, img, canvas, svg {
        cursor: none !important;
        -webkit-cursor: none !important;
        -moz-cursor: none !important;
        -ms-cursor: none !important;
        -o-cursor: none !important;
      }
      
      /* Override all possible cursor classes */
      .cursor-pointer, .cursor-default, .cursor-auto, .cursor-text,
      .cursor-grab, .cursor-grabbing, .cursor-move, .cursor-resize,
      .cursor-help, .cursor-wait, .cursor-crosshair, .cursor-progress,
      .cursor-not-allowed {
        cursor: none !important;
        -webkit-cursor: none !important;
        -moz-cursor: none !important;
        -ms-cursor: none !important;
        -o-cursor: none !important;
      }
      
      /* Browser-specific overrides */
      @media screen and (-webkit-min-device-pixel-ratio:0) {
        *, *:hover, *:focus, *:active {
          cursor: none !important;
          -webkit-cursor: none !important;
        }
      }
      
      @-moz-document url-prefix() {
        *, *:hover, *:focus, *:active {
          cursor: none !important;
          -moz-cursor: none !important;
        }
      }
    `;
    
    // Insert at the very beginning of head
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head) {
      head.insertBefore(style, head.firstChild);
    }
    
    // Force inline styles on html and body
    if (document.documentElement) {
      document.documentElement.style.setProperty('cursor', 'none', 'important');
      document.documentElement.style.setProperty('-webkit-cursor', 'none', 'important');
      document.documentElement.style.setProperty('-moz-cursor', 'none', 'important');
    }
    
    if (document.body) {
      document.body.style.setProperty('cursor', 'none', 'important');
      document.body.style.setProperty('-webkit-cursor', 'none', 'important');
      document.body.style.setProperty('-moz-cursor', 'none', 'important');
    }
  }
  
  // Run immediately
  hideCursor();
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideCursor);
  }
  
  // Run when page is fully loaded
  if (document.readyState !== 'complete') {
    window.addEventListener('load', hideCursor);
  }
  
  // Run periodically to catch any dynamic content
  setInterval(hideCursor, 100);
  
  // Watch for DOM mutations and hide cursor on new elements
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              const element = node;
              element.style.setProperty('cursor', 'none', 'important');
              
              // Also apply to all children
              const children = element.querySelectorAll('*');
              children.forEach(function(child) {
                child.style.setProperty('cursor', 'none', 'important');
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
  }
})();