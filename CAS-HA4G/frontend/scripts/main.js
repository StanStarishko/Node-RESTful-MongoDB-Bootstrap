// frontend/scripts/main.js

import {    StaffManager, 
            StudentManager, 
            CourseManager, 
            EnrollmentManager } from "./Managers.js";
import { UIUtils } from "./UIUtils.js";
import { ApiService } from "./ApiService.js";
import { TableView } from "./TableView.js";

class ApplicationManager {
    #currentView = null;
    #mainContent = null;
    #modal = null;
    #viewManagers = new Map();

    constructor() {
        this.#mainContent = document.querySelector('#mainContent');
        this.#modal = new bootstrap.Modal(document.getElementById('formModal'));
        this.#initializeManagers();
        this.#setupEventListeners();
    }

    #initializeManagers() {
        this.#viewManagers.set('staff', {
            manager: new StaffManager(),
            view: new TableView()
        });

        this.#viewManagers.set('students', {
            manager: new StudentManager(),
            view: new TableView()
        });

        this.#viewManagers.set('courses', {
            manager: new CourseManager(),
            view: new TableView()
        });

        this.#viewManagers.set('enrollments', {
            manager: new EnrollmentManager(),
            view: new TableView()
        });
    }

    #setupEventListeners() {
        document.querySelectorAll('.nav-link[data-view]').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.#switchView(e.target.dataset.view);
            });
        });

        document.getElementById('formModal').addEventListener('submit', async (e) => {
            if (e.target.id === 'dataForm') {
                e.preventDefault();
                await this.#handleFormSubmission(e);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-new-btn')) {
                this.#showFormModal('add');
            }
        });

        this.#mainContent.addEventListener('click', async (e) => {
            if (e.target.closest('.edit-btn')) {
                const button = e.target.closest('.edit-btn');
                const id = button.dataset.id;
                await this.#handleEditClick(id);
            }
        });

        this.#mainContent.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-btn')) {
                const button = e.target.closest('.delete-btn');
                const id = button.dataset.id;
                await this.#handleDeleteClick(id);
            }
        });

        document.getElementById('generateTestData')?.addEventListener('click', async () => {
            await this.#handleGenerateTestData();
        });
    }

    async #switchView(viewName) {
        try {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelector(`.nav-link[data-view="${viewName}"]`).classList.add('active');

            this.#mainContent.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
            
            this.#currentView = viewName;
            const { manager, view } = this.#viewManagers.get(viewName);

            // Refresh options for enrollment view
            if (manager instanceof EnrollmentManager) {
                await manager.refreshOptions();
            }

            const data = await manager.fetchAll();
            const content = view.createTable(data, manager.getColumns(), viewName);
            
            this.#mainContent.innerHTML = '';
            this.#mainContent.appendChild(content);
        } catch (error) {
            UIUtils.showAlert(error.message, 'danger');
        }
    }

    async #handleFormSubmission(e) {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const { manager } = this.#viewManagers.get(this.#currentView);
    
        try {
            const type = e.target.dataset.type;
            const id = e.target.dataset.id;
    
            // Check if ID already exists in the system
            if (data._id) {
                try {
                    const existingRecord = await ApiService.fetchData(`${this.#currentView}/${data._id}`);
                    if (existingRecord && (type === 'add' || (type === 'edit' && id !== data._id))) {
                        const errorMessage = 'Record with this ID already exists';
                        UIUtils.showAlert(errorMessage, 'danger');
                        UIUtils.showModal('Duplicate ID Error', errorMessage, 'danger');
                        return;
                    }
                } catch (error) {
                    // If error is 404, then ID doesn't exist, which is what we want for new records
                    if (error.status !== 404) {
                        throw error;
                    }
                }
            }
    
            if (type === 'add') {
                await manager.create(data);
            } else {
                await manager.update(id, data);
            }
    
            this.#modal.hide();
            UIUtils.showAlert('Record saved successfully');
            
            // Refresh options after any change
            if (manager instanceof EnrollmentManager) {
                await manager.refreshOptions();
            }
            
            await this.#switchView(this.#currentView);
        } catch (error) {
            const errorMessage = error.message || 'An error occurred while saving the record';
            UIUtils.showAlert(errorMessage, 'danger');
            UIUtils.showModal('Error', errorMessage, 'danger');
        }
    }

    
    async #showFormModal(type, data = null) {
        const modalTitle = document.querySelector('#formModal .modal-title');
        const modalBody = document.querySelector('#formModal .modal-body');
        const { manager } = this.#viewManagers.get(this.#currentView);

        modalTitle.textContent = type === 'add' ? 'Add New Record' : 'Edit Record';
        modalBody.innerHTML = '';

        const form = document.createElement('form');
        form.id = 'dataForm';
        form.dataset.type = type;
        if (data) {
            form.dataset.id = data._id;
        }

        const columns = manager.getColumns();
        for (const column of columns) {
            if (column.key === '_id') continue;
            await this.#createFormField(form, column, data);
        }

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary';
        submitBtn.textContent = type === 'add' ? 'Create' : 'Update';
        form.appendChild(submitBtn);

        modalBody.appendChild(form);
        this.#modal.show();
    }

    async #createFormField(form, column, data = null) {
        const formGroup = document.createElement('div');
        formGroup.className = 'mb-3';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = column.label;

        let input;
        if (column.type === 'select') {
            input = document.createElement('select');
            
            if (column.getOptions) {
                const options = await column.getOptions();
                options.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.label;
                    if (data && data[column.key] === option.value) {
                        opt.selected = true;
                    }
                    input.appendChild(opt);
                });
            } else if (column.options) {
                column.options.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.label;
                    if (data && data[column.key] === option.value) {
                        opt.selected = true;
                    }
                    input.appendChild(opt);
                });
            }
        } else {
            input = document.createElement('input');
            input.type = column.type || 'text';
            if (data) {
                if (column.type === 'date' && data[column.key]) {
                    input.value = new Date(data[column.key]).toISOString().split('T')[0];
                } else {
                    input.value = data[column.key] || '';
                }
            }
        }

        input.className = 'form-control';
        input.name = column.key;
        input.required = true;

        formGroup.appendChild(label);
        formGroup.appendChild(input);
        form.appendChild(formGroup);
    }

    async #handleEditClick(id) {
        const { manager } = this.#viewManagers.get(this.#currentView);
        try {
            if (!id) {
                // Display modal with warning about invalid record ID
                UIUtils.showModal('Error', 'Invalid record identifier', 'danger');
                throw new Error('Invalid record ID');
            }
            const data = await ApiService.fetchData(`${this.#currentView}/${id}`);
            
            if (!data) {
                // Display modal when record is not found
                UIUtils.showModal('Error', 'Record not found', 'danger');
                throw new Error('Record not found');
            }
            await this.#showFormModal('edit', data);
        } catch (error) {
            UIUtils.showAlert(`Failed to load record: ${error.message}`, 'danger');
        }
    }        

    async #handleDeleteClick(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            try {
                const { manager } = this.#viewManagers.get(this.#currentView);
                await manager.delete(id);
                
                // Refresh options after deletion
                if (manager instanceof EnrollmentManager) {
                    await manager.refreshOptions();
                }
                
                UIUtils.showAlert('Record deleted successfully');
                await this.#switchView(this.#currentView);
            } catch (error) {
                UIUtils.showAlert(error.message, 'danger');
            }
        }
    }

    async #handleGenerateTestData() {
        try {
            const response = await fetch('http://localhost:5000/api/testdata/generate', {
                method: 'POST'
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate test data');
            }
    
            UIUtils.showAlert('Test data generated successfully');
            
            if (this.#currentView) {
                const { manager } = this.#viewManagers.get(this.#currentView);
                if (manager instanceof EnrollmentManager) {
                    await manager.refreshOptions();
                }
                await this.#switchView(this.#currentView);
            }
        } catch (error) {
            UIUtils.showAlert(error.message, 'danger');
        }    
    }

    initialize() {
        document.querySelector('.nav-link[data-view="staff"]').click();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new ApplicationManager();
    app.initialize();
});