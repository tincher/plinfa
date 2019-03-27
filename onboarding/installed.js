document.getElementById('dashboard-link').addEventListener('click', event => {
    browser.tabs.create({
        url: browser.runtime.getURL("dashboard/dashboard.html"),
    });
});