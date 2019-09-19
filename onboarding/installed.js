// -----------------------------------------------------------------------------
// DASHBOARD BUTTONS
// -----------------------------------------------------------------------------

let dashboardLinks = document.getElementsByClassName('dashboard-link');
for (let linkElement of dashboardLinks) {
    linkElement.addEventListener('click', _ => {
        browser.tabs.create({
            url: browser.runtime.getURL("dashboard/dashboard.html"),
        });
    });
}
