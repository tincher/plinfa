class saveService {
    constructor() {}
    save(value) {
        return this.storage.set(value);
    }
    get() {
        return this.storage.get();
    }
    init() {
        return new Promise((resolve, reject) => {
            browser.storage.local.get('localStorage').then((result) => {
                if (result === undefined) {
                    result = false;
                }
                this.storage = this.getStorage(result);
                resolve('localStorage set');
            })
        });
    }
    migrate(local) {
        return new Promise((resolve, reject) => {
            this.storage.get().then((config) => {
                this.storage = getStorage(local);
                this.storage.set(config).then(() => resolve());
            });
        });
    }
    saveConfigLocally(local) {
        return new Promise((resolve, reject) => {
            browser.storage.local.set('localStorage').then(() => {
                this.migrate(local).then(() => {
                    this.init().then(() => {
                        resolve('successfully stored config')
                    });
                });
            }).catch((err) => reject(err));
        })
    }
    getStorage(local) {
        return local ? browser.storage.local : browser.storage.sync;
    }
}

export default new saveService();