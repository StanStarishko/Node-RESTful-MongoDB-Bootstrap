// frontend/scripts/TableView.js

import { ApiService } from './ApiService.js';

export class TableView {
    async getOptions(nameCash) {
        return await ApiService.fetchSelectOptions(nameCash);
    }

    createTable(data, columns, viewName) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';
        
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary mb-3 add-new-btn';
        addButton.textContent = 'Add New';
        wrapper.appendChild(addButton);

        const table = document.createElement('table');
        table.className = 'table table-striped table-hover';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            headerRow.appendChild(th);
        });

        const actionsHeader = document.createElement('th');
        actionsHeader.textContent = 'Actions';
        actionsHeader.style.width = '150px';
        headerRow.appendChild(actionsHeader);
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');
        
        // Prepare to fetch options for enrollments view
        const prepareOptions = async () => {
            let studentOptions = [];
            let courseOptions = [];

            if (viewName === 'enrollments') {
                try {
                    studentOptions = await this.getOptions('students');
                    courseOptions = await this.getOptions('courses');
                } catch (error) {
                    console.error('Error fetching options:', error);
                }
            }

            // Render rows with fetched options
            data.forEach(item => {
                const row = document.createElement('tr');
                columns.forEach(column => {
                    const td = document.createElement('td');

                    td.textContent = "N/A";
                    if (column.label === 'Student' && item.studentId) {
                        const columnOption = studentOptions.find(opt => opt.value === item.studentId._id);
                        td.textContent = columnOption ? columnOption.label : item;
                    } else if (column.label === 'Course' && item.courseId) {
                        const columnOption = courseOptions.find(opt => opt.value === item.courseId._id);
                        td.textContent = columnOption ? columnOption.label : item;
                    } else {
                        td.textContent = column.format ? 
                        column.format(item[column.key]) : 
                        item[column.key];
                    }
                    
                    row.appendChild(td);
                });

                // Add action buttons
                const actionsTd = document.createElement('td');
                actionsTd.innerHTML = `
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary edit-btn" data-id="${item._id}">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-outline-danger delete-btn" data-id="${item._id}">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                `;
                row.appendChild(actionsTd);
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            wrapper.appendChild(table);
        };

        // Trigger option preparation and row rendering
        prepareOptions();

        return wrapper;
    }
}