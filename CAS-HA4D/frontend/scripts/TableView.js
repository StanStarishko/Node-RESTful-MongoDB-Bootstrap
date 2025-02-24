// frontend/scripts/TableView.js

import { ApiService } from "./ApiService.js";

export class TableView {
  #tooltips = []; // Store tooltip instances

  constructor() {
    // Clean up tooltips when view changes
    document.addEventListener("click", (e) => {
      if (e.target.closest(".details-btn")) {
        this.destroyTooltips();
      }
    });
  }

  destroyTooltips() {
    this.#tooltips.forEach((tooltip) => tooltip.dispose());
    this.#tooltips = [];
  }

  async getOptions(nameCash) {
    return await ApiService.fetchSelectOptions(nameCash);
  }

  createTable(data, columns, viewName) {
    const wrapper = document.createElement("div");
    wrapper.className = "table-responsive";

    const addButton = document.createElement("button");
    addButton.className = "btn btn-primary mb-3 add-new-btn";
    addButton.textContent = "Add New";
    wrapper.appendChild(addButton);

    const table = document.createElement("table");
    table.className = "table table-striped table-hover";

    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    columns.forEach((column) => {
      const th = document.createElement("th");
      th.textContent = column.label;
      headerRow.appendChild(th);
    });

    const actionsHeader = document.createElement("th");
    actionsHeader.textContent = "Actions";
    actionsHeader.style.width = "200px"; // Increased width for additional button
    headerRow.appendChild(actionsHeader);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement("tbody");

    // Ensure data is an array and handle edge cases
    const dataArray = Array.isArray(data) ? data : [];

    dataArray.forEach((item) => {
      const row = document.createElement("tr");
      columns.forEach((column) => {
        const td = document.createElement("td");
        td.textContent = column.format
          ? column.format(item[column.key])
          : item[column.key];
        row.appendChild(td);
      });

      // Add action buttons
      const actionsTd = document.createElement("td");
      const btnGroup = document.createElement("div");
      btnGroup.className = "btn-group btn-group-sm";

      // Edit button
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-outline-primary edit-btn";
      editBtn.dataset.id = item._id;
      editBtn.innerHTML = '<i class="bi bi-pencil"></i> Edit';
      btnGroup.appendChild(editBtn);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-outline-danger delete-btn";
      deleteBtn.dataset.id = item._id;
      deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Delete';
      btnGroup.appendChild(deleteBtn);

      // Details button for students and courses views
      if (viewName === "students" || viewName === "courses") {
        const detailsBtn = document.createElement("button");
        detailsBtn.className = "btn btn-outline-dark details-btn";
        detailsBtn.dataset.id = item._id;
        detailsBtn.dataset.type = viewName;
        detailsBtn.dataset.itemName = viewName === 'students' ? item.idNumber + "  " + item.forename + "  " + item.surname: item.courseId + "  " + item.courseName;
        detailsBtn.innerHTML = '<i class="bi bi-info-circle"></i> Details';

        // Add tooltip
        detailsBtn.title =
          viewName === "students" ? "Courses list" : "Students list";
        detailsBtn.setAttribute("data-bs-toggle", "tooltip");
        detailsBtn.setAttribute("data-bs-placement", "top");

        btnGroup.appendChild(detailsBtn);
      }

      actionsTd.appendChild(btnGroup);
      row.appendChild(actionsTd);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);

    // Initialize tooltips with instance tracking
    const tooltipTriggerList = [].slice.call(
      wrapper.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    this.#tooltips = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    return wrapper;
  }
}
