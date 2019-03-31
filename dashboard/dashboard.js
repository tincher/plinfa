// -----------------------------------------------------------------------------
// imports
// -----------------------------------------------------------------------------

import saveService from '../services/saveService.js';

// -----------------------------------------------------------------------------
// variables
// -----------------------------------------------------------------------------

let delBtns;
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

// search bar listener
searchBar.addEventListener('input', e => {
	let inp = searchBar.value;
	if (inp !== '') {
		let matches = searchWord(inp).then((res) => {
			clusterize.update(buildTableRows(res));
		});
	} else {
		updateSite();
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
		}
		delBtns = Array.from(document.getElementsByClassName('pure-button deleteButton'));
		delBtns.map(delBtn => addEventListener('click', delRow));
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

// build a single table row from config entry
function buildTableRow(configEntry, counter) {
	// seperate words
	let channelString = `<td>${configEntry.channel}</td>`
	let listTypeString = `<td><div><input name="whitelist${counter}" type="radio" ${configEntry.whitelist ? "checked" : ""}>Whitelist<input name="whitelist${counter}" type="radio" ${configEntry.whitelist ? "" : "checked"}>Blacklist</div></td>`
	let valuesString = `<td><input style="width: 100%" type="text" value="${configEntry.words}"></input></td>`;
	let delButton = `<td><button class='pure-button deleteButton' id="${configEntry.channel.replace(' ', '')}"><i class="fa fa-trash" aria-hidden="true"></i></button></td>`;
	return `<tr>${channelString}${listTypeString}${valuesString}${delButton}</tr>`;
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

// deletes a config entry and updates site
function delRow(e) {
	let channelName = e.target.id;
	saveService.get().then((cfg) => {
		let cfgValue = cfg.value.filter(function(obj) {
			return (obj.channel.replace(' ', '') != channelName);
		});
		cfg.value = cfgValue;
		saveService.save(cfg).then(e => {
			updateSite();
		});
	});
}

// -----------------------------------------------------------------------------
// search bar function and listener
// -----------------------------------------------------------------------------

// filters the config by given substring
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