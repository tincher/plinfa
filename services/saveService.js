class saveService {

    constructor() {
        this.storage = browser.storage.local;
    }

    save(value) {
        return this.storage.set(value);
    }

    get() {
        return this.storage.get();
    }

    init() {
        return new Promise((resolve, reject) => {
            browser.storage.local.get('storageSetToLocal')
                .then((isSetToLocal) => {
                    if (isSetToLocal === undefined || isSetToLocal === false) {
                        this.storage = browser.storage.sync
                    }
                    resolve('storage successfully set');
                })
                .catch((err) => reject(err));
        });
    }

    migrate(setToLocalStorage) {
        return new Promise((resolve, reject) => {
            this.storage.get()
                .then((config) => {
                    this.storage = setToLocalStorage ? browser.storage.local : browser.storage.sync;
                    this.storage.set(config)
                        .then(() =>
                            resolve('successfully migrated to: ' + (setToLocalStorage ? 'local' : 'sync') + 'storage')
                        ).catch((err) => reject(err));
                })
                .catch((err) => reject(err));
        });
    }

    saveConfigLocally(local) {
        return new Promise((resolve, reject) => {
            browser.storage.local.set('storageSetToLocal')
                .then(() => {
                    this.migrate(local).then(() => {
                        this.init().then(() => {
                            resolve('successfully stored config')
                        });
                    });
                })
                .catch((err) => reject(err));
        })
    }

}

export default new saveService();