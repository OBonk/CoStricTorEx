document.getElementById('back').onclick = function() {
    // Go back to the previous page
    browser.runtime.sendMessage({command: "goBack"});
};

document.getElementById('continue').onclick = function() {
    // Continue to the website
    browser.runtime.sendMessage({command: "proceedUnsafe"});
};