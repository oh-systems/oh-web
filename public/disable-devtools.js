// Disable right-click and DevTools shortcuts in production
(function() {
  if (typeof window !== 'undefined') {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    }, false);

    // Disable common DevTools keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+I / Cmd+Opt+I (Inspect)
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 73) || 
          (e.metaKey && e.altKey && e.keyCode === 73)) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+J / Cmd+Opt+J (Console)
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 74) || 
          (e.metaKey && e.altKey && e.keyCode === 74)) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+C / Cmd+Opt+C (Inspect Element)
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 67) || 
          (e.metaKey && e.altKey && e.keyCode === 67)) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey && e.keyCode === 85) || 
          (e.metaKey && e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
    }, false);
  }
})();
