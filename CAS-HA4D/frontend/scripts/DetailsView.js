// frontend/scripts/DetailsView.js

import { ApiService } from "./ApiService.js";
import { UIUtils } from "./UIUtils.js";

export class DetailsView {
    constructor() {
        this.mainContent = document.querySelector('#mainContent');
    }

    async showDetails(id, type, itemName) {
        try {
            const data = await this.#fetchDetailsData(id, type);
            const content = this.#createDetailsView(data, type, id, itemName);
            
            // Create wrapper for the details view
            const wrapper = document.createElement('div');
            wrapper.className = 'details-view-wrapper';
            wrapper.appendChild(this.#createBackButton());
            wrapper.appendChild(content);
            
            this.mainContent.innerHTML = '';
            this.mainContent.appendChild(wrapper);
            
            // Setup event listeners
            this.#setupEventListeners(id, type);
        } catch (error) {
            UIUtils.showAlert(error.message, 'danger');
        }
    }

    async #fetchDetailsData(id, type) {
        const endpoint = type === 'students' 
            ? `enrollments/student/${id}`
            : `enrollments/course/${id}`;
        return await ApiService.fetchData(endpoint);
    }

    #createDetailsView(data, type, id, itemName) {
        const container = document.createElement('div');
        container.className = 'container mt-4';

        // Add title
        const title = document.createElement('h3');
        title.textContent = type === 'students' ? 'Enrolled Courses' : 'Enrolled Students';
        title.textContent = title.textContent + " for " + itemName;
        container.appendChild(title);

        // Add new button
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary mb-3';
        addButton.textContent = `Add ${type === 'students' ? 'Course' : 'Student'}`;
        addButton.dataset.type = type;
        addButton.dataset.id = id;
        addButton.classList.add('add-enrollment-btn');
        container.appendChild(addButton);

        // Create table
        const table = document.createElement('table');
        table.className = 'table table-striped';
        
        // Table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = type === 'students' 
            ? ['Course ID', 'Course Name', 'Start Date', 'Actions']
            : ['Student ID', 'Name', 'Actions'];
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Table body
        const tbody = document.createElement('tbody');
        data.forEach(item => {
            const row = document.createElement('tr');
            if (type === 'students') {
                const course = item.courseId;
                row.innerHTML = `
                    <td>${course.courseId}</td>
                    <td>${course.courseName}</td>
                    <td>${UIUtils.formatDate(course.courseStart)}</td>
                    <td>
                        <button class="btn btn-danger btn-sm delete-enrollment-btn" 
                                data-id="${item._id}">
                            <i class="bi bi-trash"></i> Remove
                        </button>
                    </td>
                `;
            } else {
                const student = item.studentId;
                row.innerHTML = `
                    <td>${student.idNumber}</td>
                    <td>${student.forename} ${student.surname}</td>
                    <td>
                        <button class="btn btn-danger btn-sm delete-enrollment-btn" 
                                data-id="${item._id}">
                            <i class="bi bi-trash"></i> Remove
                        </button>
                    </td>
                `;
            }
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.appendChild(table);

        return container;
    }

    #createBackButton() {
        const backButton = document.createElement('button');
        backButton.className = 'btn btn-secondary mb-3';
        backButton.innerHTML = '<i class="bi bi-arrow-left"></i> Back';
        backButton.addEventListener('click', () => {
            // Trigger click on the active nav item to refresh the main view
            document.querySelector('.nav-link.active').click();
        });
        return backButton;
    }

    #setupEventListeners(currentId, type, itemName) {
        // Add enrollment button handler
        const addBtn = this.mainContent.querySelector('.add-enrollment-btn');
        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                await this.#showEnrollmentModal(currentId, type);
            });
        }

        // Delete enrollment button handler
        this.mainContent.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-enrollment-btn')) {
                const button = e.target.closest('.delete-enrollment-btn');
                const enrollmentId = button.dataset.id;
                if (confirm('Are you sure you want to remove this enrollment?')) {
                    try {
                        await ApiService.deleteData('enrollments', enrollmentId);
                        UIUtils.showAlert('Enrollment removed successfully');
                        await this.showDetails(currentId, type, itemName);
                    } catch (error) {
                        UIUtils.showAlert(error.message, 'danger');
                    }
                }
            }
        });
    }

    async #showEnrollmentModal(currentId, type, itemName) {
        const modalTitle = document.querySelector('#formModal .modal-title');
        const modalBody = document.querySelector('#formModal .modal-body');
        
        modalTitle.textContent = `Add ${type === 'students' ? 'Course' : 'Student'} Enrollment`;
        modalBody.innerHTML = '';

        const form = document.createElement('form');
        form.id = 'enrollmentForm';
        
        // Create select field
        const formGroup = document.createElement('div');
        formGroup.className = 'mb-3';
        
        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = type === 'students' ? 'Select Course' : 'Select Student';
        
        const select = document.createElement('select');
        select.className = 'form-control';
        select.required = true;
        
        // Get available options
        const options = await ApiService.fetchSelectOptions(type === 'students' ? 'courses' : 'students');
        
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            select.appendChild(opt);
        });
        
        formGroup.appendChild(label);
        formGroup.appendChild(select);
        form.appendChild(formGroup);

        // Add submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary';
        submitBtn.textContent = 'Add Enrollment';
        form.appendChild(submitBtn);

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const enrollmentData = {
                    studentId: type === 'students' ? currentId : select.value,
                    courseId: type === 'students' ? select.value : currentId
                };
                
                await ApiService.createData('enrollments', enrollmentData);
                const modal = bootstrap.Modal.getInstance(document.getElementById('formModal'));
                modal.hide();
                
                UIUtils.showAlert('Enrollment added successfully');
                await this.showDetails(currentId, type, itemName);
            } catch (error) {
                UIUtils.showAlert(error.message, 'danger');
            }
        });

        modalBody.appendChild(form);
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        modal.show();
    }
}