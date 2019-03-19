data = [];
clusterize = new Clusterize({
    rows: data,
    scrollId: 'scrollArea',
    contentId: 'contentArea'
});

// get config from storage, build rows, push them to clusterize
function main() {
    browser.storage.local.get().then((config) => {
        var data = buildTableRows(config.value);
        clusterize.update(data);
    }).catch((error) => {
        console.log(error);
    });
}

// build table rows from config object
function buildTableRows(config) {
    let result = [];
    // map?! TODO
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

document.getElementById('saveButton').addEventListener('click', (event) => {
    let tbody = document.getElementById('contentArea');
    let config = {
        value: parseTbodyToConfig(tbody)
    };
    browser.storage.local.set(config).then((e) => {
        main();
    }).catch((error) => {
        console.log(error);
    });
});

function parseTrowToConfigEntry(entry) {
    let children = entry.children;
    let result = {
        channel: children.item(0).textContent,
        words: children.item(2).children.item(0).value.split(','),
        whitelist: children.item(1).children.item(0).children.item(0).checked
    };
    return result;
}

function parseTbodyToConfig(tbody) {
    let result = [];
    for (let i = 0; i < tbody.children.length; i++) {
        result.push(parseTrowToConfigEntry(tbody.children.item(i)));
    }
    return result;
}

// run main
main();