document.getElementById('modeSwitch').addEventListener('change', function(event) {
    if (event.target.checked) {
      // Go back to the previous page
      browser.storage.local.set({mode: "silent"});
      document.getElementById('mode').textContent = 'Silent Mode';
      document.getElementById('TLS_check').style.visibility = "visible";
      browser.runtime.sendMessage({command: "silent"});
  } else {
      // Continue to the website
      browser.storage.local.set({mode: "probe"});
      document.getElementById('mode').textContent = 'Probe Mode';
      document.getElementById('TLS_check').style.visibility = "hidden";
      browser.runtime.sendMessage({command: "probe"});
  }
  });
  document.getElementById('TLS_check').addEventListener('change', function(event) {
    if (this.checked){
        browser.runtime.sendMessage({command: "TLS+"});
    }else{
        browser.runtime.sendMessage({command: "TLS-"});
    }
  });
//   document.getElementById('save').addEventListener('click', function() {
//     // Turn off extension
//     browser.runtime.sendMessage({command: "save"});
// });
// document.getElementById('off').addEventListener('click', function() {
//     // Turn off extension
//     browser.runtime.sendMessage({command: "off"});
// });
document.addEventListener('DOMContentLoaded', function() {
    // Retrieve the stored state and update the UI
    browser.storage.local.get("mode", function(result) {
      const modeSwitch = document.getElementById('modeSwitch');
      const modeLabel = document.getElementById('mode');
      
      if(result.mode === "silent") {
        modeSwitch.checked = true;
        modeLabel.textContent = "Silent Mode";
        document.getElementById('TLS_check').style.visibility = "visible";
      } else {
        modeSwitch.checked = false;
        modeLabel.textContent = "Probe Mode";
        document.getElementById('TLS_check').style.visibility = "hidden";
      }
    });
    browser.storage.local.get("mode", function(result) {
        const tlsSwitch = document.getElementById('TLS_check');
        if (result=="true"){
            tlsSwitch.checked = true;
        } else {
            tlsSwitch.checked = false;
        }
    })
  });
  