document.getElementById('modeSwitch').addEventListener('change', function(event) {
    if (event.target.checked) {
      // Go back to the previous page
      document.getElementById('mode').textContent = 'Silent Mode';
      browser.runtime.sendMessage({command: "silent"});
  } else {
      // Continue to the website
      document.getElementById('mode').textContent = 'Probe Mode';
      browser.runtime.sendMessage({command: "probe"});
  }
  });