// -----------------------------------------------------------------------------
// event listeners
// -----------------------------------------------------------------------------

// button click saves config to local storage
document.getElementById('saveButton').addEventListener('click', (event) => {
    let tbody = document.getElementById('contentArea');
    let config = {
        value: parseTbodyToConfig(tbody)
    };
    browser.storage.local.set(config).then((e) => {
        updateSite();
    }).catch((error) => {
        console.log(error);
    });
});


// -----------------------------------------------------------------------------
// initialisation
// -----------------------------------------------------------------------------

// init clusterize.js with emtpy dataset
data = [];
delButtons = [];
clusterize = new Clusterize({
    rows: data,
    scrollId: 'scrollArea',
    contentId: 'contentArea',
    show_no_data_row: false,
});
btnClusterize = new Clusterize({
    rows: delButtons,
    scrollId: 'buttonScroll',
    contentId: 'buttonContent',
    show_no_data_row: false
});

// btnContainer for eventlistener below
btnDiv = document.getElementById('buttonContent');

// run updateSite
updateSite();


// -----------------------------------------------------------------------------
// update site
// -----------------------------------------------------------------------------

// get config from storage, build rows, push them to clusterize
function updateSite() {
    browser.storage.local.get().then((config) => {
        let data = buildTableRows(config.value);
        clusterize.update(data);
        delButtons = [];
        data.forEach((row, counter) => {
          let btn_str = `<button class='pure-button deleteButton' id=${counter}><i class="fas fa-trash"></i></button>`;
          delButtons.push(btn_str);
        });
        btnClusterize.update(delButtons);
    }).catch((error) => {
        console.log(error);
    });
}


// -----------------------------------------------------------------------------
// builder
// -----------------------------------------------------------------------------

// build table rows from config object
function buildTableRows(config) {
    let result = [];
    // TODO map?!
    config.forEach((configEntry, counter) => {
        result.push(buildTableRow(configEntry, counter));
    });
    return result;
}


// build a single table row from config entry
function buildTableRow(configEntry, counter) {
    // seperate words
    let channelString = `<td>${configEntry.channel}</td>`
    let listTypeString = `<td><div><input name="whitelist${counter}" type="radio" ${configEntry.whitelist ? "checked" : ""}>Whitelist<input name="whitelist${counter}" type="radio" ${configEntry.whitelist ? "" : "checked"}>Blacklist</div></td>`
    let valuesString = `<td><input style="width: 100%" type="text" value="${configEntry.words}"></input></td>`
    return `<tr>${channelString}${listTypeString}${valuesString}</tr>`;
}

// dummy row for testing
function buildDummyRow(counter) {
    configEntry = {
        channel: 'Channel 1',
        whitelist: true,
        words: ['Entry 1', 'entry 2']
    }

    return buildTableRow(configEntry, counter)
}


// -----------------------------------------------------------------------------
// parser (from table to config)
// -----------------------------------------------------------------------------

// builds config entry from table row
function parseTrowToConfigEntry(entry) {
    let children = entry.children;
    let result = {
        channel: children.item(0).textContent,
        words: children.item(2).children.item(0).value.split(','),
        whitelist: children.item(1).children.item(0).children.item(0).checked
    };
    return result;
}

// builds config object from table body
function parseTbodyToConfig(tbody) {
    let result = [];
    for (let i = 0; i < tbody.children.length; i++) {
        result.push(parseTrowToConfigEntry(tbody.children.item(i)));
    }
    return result;
}

// deletes selected row from config, refreshes dashboard
btnDiv.addEventListener('click', e => {
  row_ind = e.target.attributes.id.value;
  if (row_ind != 'buttonContent') {
    console.log(row_ind);
    browser.storage.local.get().then((config) => {
      delete config.value[row_ind];
      browser.storage.local.set(config).then(e => {
        updateSite();
      });
    });
  }
});
