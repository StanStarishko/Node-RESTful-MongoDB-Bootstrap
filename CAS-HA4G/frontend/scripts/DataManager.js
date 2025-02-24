// frontend/scripts/DataManager.js

import {TableView} from "./TableView.js";

export class DataManager {
    #endpoint;
    #columns;

    constructor(endpoint, columns) {
        this.#endpoint = endpoint;
        this.#columns = columns;
    }

    async fetchAll() {
        return await ApiService.fetchData(this.#endpoint);
    }

    async create(data) {
        return await ApiService.createData(this.#endpoint, data);
    }

    async update(id, data) {
        return await ApiService.updateData(this.#endpoint, id, data);
    }

    async delete(id) {
        return await ApiService.deleteData(this.#endpoint, id);
    }

    getColumns() {
        return this.#columns;
    }

    getEndpoint() {
        return this.#endpoint;
    }
}

// ViewManager
export class ViewManager {
    #dataManager;
    #tableView;

    constructor(dataManager) {
        this.#dataManager = dataManager;
        this.#tableView = new TableView(this.#handleEdit.bind(this), this.#handleDelete.bind(this));
    }

    async render() {
        try {
            const data = await this.#dataManager.fetchAll();
            return this.#tableView.createTable(data, this.#dataManager.getColumns());
        } catch (error) {
            UIUtils.showAlert(error.message, 'danger');
        }
    }

    async #handleEdit(id, data) {
        try {
            await this.#dataManager.update(id, data);
            UIUtils.showAlert('Record updated successfully');
            await this.render();
        } catch (error) {
            UIUtils.showAlert(error.message, 'danger');
        }
    }

    async #handleDelete(id) {
        try {
            await this.#dataManager.delete(id);
            UIUtils.showAlert('Record deleted successfully');
            await this.render();
        } catch (error) {
            UIUtils.showAlert(error.message, 'danger');
        }
    }
}
