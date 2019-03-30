// -----------------------------------------------------------------------------
// imports
// -----------------------------------------------------------------------------

import saveService from '../services/saveService.js';

// -----------------------------------------------------------------------------
// variables
// -----------------------------------------------------------------------------

let btnDiv = document.getElementById('buttonContent');
let localStorageRadio = document.getElementById('localStorage');
let syncStorageRadio = document.getElementById('syncStorage');
let activeCheckbox = document.getElementById('active');
let progress = document.getElementById('progress');
let searchBar = document.getElementById('searchBar');

// -----------------------------------------------------------------------------
// progress bar
// -----------------------------------------------------------------------------

function move(percentage) {
	let width = progress.style.width.slice(0, -1);
	let intervalId = setInterval(updateProgress, 7);

	function updateProgress() {
		if (width >= percentage) {
			if (width >= 100) {
				progress.className += 'success-bar';
				let clearingIntervalId = setInterval(clearProgress, 500);

				function clearProgress() {
					progress.className = '';
					progress.style.width = '0px';
					clearInterval(clearingIntervalId);
				}
			}
			clearInterval(intervalId);
		} else {
			width++;
			progress.style.width = width + '%';
		}
	}
}


// -----------------------------------------------------------------------------
// event listeners
// -----------------------------------------------------------------------------

// button click saves config to local storage
document.getElementById('saveButton').addEventListener('click', (event) => {
	move(10);
	let tbody = document.getElementById('contentArea');
	let config = {
		value: parseTbodyToConfig(tbody),
		localStorage: localStorageRadio.checked,
		active: activeCheckbox.checked
	};
	move(40);
	saveService.save(config).then((e) => {
		move(100);
		updateSite();
	}).catch((error) => {
		console.log(error);
		bar.style.backgroundColor = 'red';
	});
});

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


// -----------------------------------------------------------------------------
// initialisation
// -----------------------------------------------------------------------------

// init clusterize.js with emtpy dataset
let clusterize = new Clusterize({
	rows: [],
	scrollId: 'scrollArea',
	contentId: 'contentArea',
	show_no_data_row: true,
});
let btnClusterize = new Clusterize({
	rows: [],
	scrollId: 'buttonScroll',
	contentId: 'buttonContent',
	show_no_data_row: false
});


// -----------------------------------------------------------------------------
// update site
// -----------------------------------------------------------------------------

// get config from storage, build rows, push them to clusterize
function updateSite() {
	saveService.get().then((config) => {
		if (!config.localStorage) {
			syncStorage.checked = true;
		} else {
			localStorage.checked = true;
		}
		activeCheckbox.checked = config.active;
		if (config.value !== undefined) {
			clusterize.update(buildTableRows(config.value));
			btnClusterize.update(buildDeleteButtons(config.value));
		}
	}).catch((error) => {
		console.log(error);
	});
}

// run updateSite
saveService.init().then(() => updateSite());


// -----------------------------------------------------------------------------
// builder
// -----------------------------------------------------------------------------

// build table rows from config object
function buildTableRows(config) {
	return config.map((item, i) => buildTableRow(item, i))
}

// builds deleteButtons from conf object
function buildDeleteButtons(config) {
	return config.map((confObj) => `<button class='pure-button deleteButton' id=${confObj.channel.replace(' ', '')}><i class="fas fa-trash"></i></button>`);
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
	let channelName = '';
	if (e.target.tagName === 'I') {
		channelName = e.target.parentElement.attributes.id.value
	} else {
		channelName = e.target.attributes.id.value;
	}
	if (channelName !== 'buttonContent') {
		saveService.get().then((config) => {
			config.value = config.value.filter(item => item.channel.replace(' ', '') != channelName);
			saveService.save(config).then(e => {
				updateSite();
			});
		});
	}
});

// -----------------------------------------------------------------------------
// search bar function and listener
// -----------------------------------------------------------------------------

function searchWord(chars) {
	return new Promise((resolve, reject) => {
		saveService.get().then((cfg) => {
			let matchObj = cfg.value.filter(function(obj) {
				let foundInd = obj.words.findIndex(function(word) {
					return word.includes(chars);
				});
				return obj.channel.includes(chars) || foundInd > -1
			});
			resolve(matchObj);
		}).catch((error) => {
			console.log(error);
		});
	});
}

searchBar.addEventListener('input', e => {
	let inp = searchBar.value;
	if (inp !== '') {
		let matches = searchWord(inp).then((res) => {
			clusterize.update(buildTableRows(res));
		});
	}
});