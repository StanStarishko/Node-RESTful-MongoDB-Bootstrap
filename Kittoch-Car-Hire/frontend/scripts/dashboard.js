import {
  getCarTitle,
  checkVehicleAvailability,
  formatDate,
  createServerWakeupService,
} from "./utilities.js";

const wakeupService = createServerWakeupService();
wakeupService.start();

const currentDate = new Date();

$(document).ready(() => {
  const apiUrl = "https://kittoch-car-hire.onrender.com/api/universalCRUD";
  let isLoading = false;

  // Show loading state
  function showLoading(tableBodySelector) {
    const tableBody = $(tableBodySelector);
    tableBody.html(
      '<tr><td colspan="8" class="text-center">Loading...</td></tr>'
    );
  }

  // Show error state
  function showError(tableBodySelector, error) {
    const tableBody = $(tableBodySelector);
    tableBody.html(
      `<tr><td colspan="8" class="text-center text-danger">Error: ${error}</td></tr>`
    );
  }

  // Handle navigation tabs with URL state
  function initializeTabs() {
    // Get active tab from URL or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const activeTab =
      urlParams.get("activeTab") ||
      sessionStorage.getItem("activeTab") ||
      "tabBooking";

    // Activate the correct tab
    $(`#${activeTab}`).click();

    // Update URL without reload
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("activeTab", activeTab);
    window.history.pushState({}, "", newUrl);
  }

  $(".nav-link").click(function (e) {
    e.preventDefault();
    const tabId = $(this).attr("id");

    // Update UI
    $(".nav-link").removeClass("active");
    $(this).addClass("active");
    $("#content > div").addClass("d-none");
    $(`#tabContent${tabId.replace("tab", "")}`).removeClass("d-none");

    // Update session storage and URL
    sessionStorage.setItem("activeTab", tabId);
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("activeTab", tabId);
    window.history.pushState({}, "", newUrl);

    // Load data for the active tab
    loadDataForTab(tabId);
  });

  // Add buttons handlers
  const collections = {
    addBooking: "Booking",
    addVehicle: "Vehicle",
    addCustomer: "Customer",
    addEmployee: "Employee",
  };

  Object.entries(collections).forEach(([buttonId, collection]) => {
    $(`#${buttonId}`).click(() => {
      const activeTab = $(".nav-link.active").attr("id");
      const returnUrl = encodeURIComponent(
        `${window.location.pathname}?activeTab=${activeTab}`
      );
      window.location.href = `/frontend/html/addPages.html?collection=${collection}&returnUrl=${returnUrl}`;
    });
  });

  // Action buttons creator
  function createActionButtons(
    id,
    collectionId,
    collection,
    isAvailable = false
  ) {
    const bookingButton =
      collection === "Vehicle"
        ? `<button class="btn btn-link book-vehicle-btn" 
                      data-id="${id}" 
                      style="display: ${isAvailable ? "inline-block" : "none"}">
              <i class="bi bi-calendar-heart" style="color: #007BFF"></i>
           </button>`
        : "";

    return `
        <div class="btn-group">
            <button class="btn btn-link edit-btn" data-id="${collectionId}" data-collection="${collection}">
                <i class="bi bi-pencil-square" style="color: black"></i>
            </button>
            <button class="btn btn-link delete-btn" data-id="${id}" data-collection="${collection}">
                <i class="bi bi-x-circle" style="color: red"></i>
            </button>
            ${bookingButton}
        </div>
    `;
  }

  // New function to handle date change and availability check
  async function handleDateChange(
    dateInput,
    vehicleId,
    availabilityCell,
    bookButton
  ) {
    const selectedDate = new Date(dateInput.value);

    try {
      const isAvailable = await checkVehicleAvailability(
        vehicleId,
        selectedDate
      );
      availabilityCell.textContent = isAvailable ? "Available" : "Booked";
      availabilityCell.className = isAvailable ? "text-success" : "text-danger";

      // Toggle booking button visibility based on availability
      if (bookButton) {
        bookButton.style.display = isAvailable ? "inline-block" : "none";
      }
    } catch (error) {
      availabilityCell.textContent = "Status Unknown";
      availabilityCell.className = "text-warning";
      console.error("Availability check failed:", error);
    }
  }

  // Generic data loader
  async function loadTableData(collection, tableBodySelector, createRow) {
    if (isLoading) return;
    isLoading = true;
    showLoading(tableBodySelector);

    try {
      const response = await fetch(`${apiUrl}/list/${collection}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const { results } = await response.json();
      let data = null;

      // Fetch additional data for 'Booking' collection
      if (collection === "Booking") {
        data = await Promise.all(
          results.map(async (item) => {
            const [customer, car] = await Promise.all([
              fetchOptionsFromCollection(item.CustomerId, "Customer"),
              fetchOptionsFromCollection(item.CarId, "Vehicle"),
            ]);
            return { ...item, customer, car };
          })
        );
      } else {
        data = results;
      }

      const tableBody = $(tableBodySelector);
      tableBody.empty();

      if (data.length === 0) {
        tableBody.html(
          '<tr><td colspan="8" class="text-center">No data available</td></tr>'
        );
        return;
      }

      data.forEach((item) => createRow(item, tableBody, collection));
    } catch (error) {
      console.error(`Error loading ${collection}:`, error);
      showError(tableBodySelector, error.message);
    } finally {
      isLoading = false;
    }
  }

  // Table data loaders
  const loadBookings = () =>
    loadTableData(
      "Booking",
      "#bookingTableBody",
      async (booking, tableBody) => {
        try {
          tableBody.append(`
          <tr>
            <td>${formatDate(booking.BookingDate)}</td>
            <td>${booking.customer.CustomerId || "N/A"}</td>
            <td>${getCarTitle(booking.car) || "N/A"}</td>
            <td>${formatDate(booking.StartDate)}</td>
            <td>${booking.PickupLocation}</td>
            <td>${formatDate(booking.ReturnDate)}</td>
            <td>${booking.DropoffLocation}</td>
            <td>${createActionButtons(
              booking._id,
              booking.BookingId,
              "Booking"
            )}</td>
          </tr>
        `);
        } 
        catch (error) {
          console.error("Error loading booking details:", error);
          tableBody.append(`
          <tr>
            <td>${formatDate(booking.BookingDate)}</td>
            <td>N/A</td>
            <td>N/A</td>
            <td>${formatDate(booking.StartDate)}</td>
            <td>${booking.PickupLocation}</td>
            <td>${formatDate(booking.ReturnDate)}</td>
            <td>${booking.DropoffLocation}</td>
            <td>${createActionButtons(
              booking._id,
              booking.BookingId,
              "Booking"
            )}</td>
          </tr>
        `);
        }
      }
    );

  // Load Vehicles
  const loadVehicles = () =>
    loadTableData("Vehicle", "#vehicleTableBody", (vehicle, tableBody) => {
      const row = document.createElement("tr");
      const availabilityCell = document.createElement("td");
      availabilityCell.textContent = "Checking...";

      // Create date input cell
      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = formatDate(currentDate, true);
      dateInput.className = "date-cell form-control text-center";

      row.innerHTML = `
            <td class="align-middle">${vehicle.VehicleId}</td>
            <td class="align-middle">${vehicle.Make}</td>
            <td class="align-middle">${vehicle.Model}</td>
            <td class="align-middle">${vehicle.Fuel}</td>
            <td class="align-middle">${vehicle.CostPerDay}</td>
            <td class="availability-cell align-middle"></td>
            <td class="date-cell align-middle"></td>
            <td class="actions-cell align-middle">${createActionButtons(
              vehicle._id,
              vehicle.VehicleId,
              "Vehicle",
              availabilityCell.value
            )}</td>
        `;

      // Replace placeholder cells with actual elements
      row.querySelector(".availability-cell").replaceWith(availabilityCell);
      row.querySelector(".date-cell").replaceWith(dateInput);

      const bookButton = row.querySelector(".book-vehicle-btn");

      // Add date change handler
      dateInput.addEventListener("change", () => {
        handleDateChange(dateInput, vehicle._id, availabilityCell, bookButton);
      });

      handleDateChange(dateInput, vehicle._id, availabilityCell, bookButton);

      tableBody.append(row);
    });

  // Load Customers
  const loadCustomers = () =>
    loadTableData("Customer", "#customerTableBody", (customer, tableBody) => {
      tableBody.append(`
                <tr>
                    <td>${customer.CustomerId}</td>
                    <td>${customer.Forename}</td>
                    <td>${customer.Surname}</td>
                    <td>${formatDate(customer.DateOfBirth)}</td>
                    <td>${customer.Gender}</td>
                    <td>${customer.Phone}</td>
                    <td>${createActionButtons(
                      customer._id,
                      customer.CustomerId,
                      "Customer"
                    )}</td>
                </tr>
            `);
    });

  // Load Employees
  const loadEmployees = () =>
    loadTableData("Employee", "#employeeTableBody", (employee, tableBody) => {
      tableBody.append(`
                <tr>
                    <td>${employee.EmployeeId}</td>
                    <td>${employee.Forename}</td>
                    <td>${employee.Surname}</td>
                    <td>${formatDate(employee.DateOfBirth)}</td>
                    <td>${employee.Gender}</td>
                    <td>${employee.Phone}</td>
                    <td>${createActionButtons(
                      employee._id,
                      employee.EmployeeId,
                      "Employee"
                    )}</td>
                </tr>
            `);
    });

  // Load data based on active tab
  function loadDataForTab(tabId) {
    switch (tabId) {
      case "tabBooking":
        loadBookings();
        break;
      case "tabVehicle":
        loadVehicles();
        break;
      case "tabCustomer":
        loadCustomers();
        break;
      case "tabEmployee":
        loadEmployees();
        break;
    }
  }

  // Add new event handler for booking button
  $(document).on("click", ".book-vehicle-btn", function () {
    const vehicleId = $(this).data("id");
    const dateInput = $(this).closest("tr").find("input[type='date']").val();
    const activeTab = $(".nav-link.active").attr("id");
    const returnUrl = encodeURIComponent(
      `${window.location.pathname}?activeTab=${activeTab}`
    );

    // Redirect to universal form with pre-filled values
    window.location.href = `/frontend/html/addPages.html?collection=Booking&returnUrl=${returnUrl}&prefill=${encodeURIComponent(
      JSON.stringify({
        CarId: vehicleId,
        BookingDate: formatDate(currentDate, true),
        StartDate: formatDate(dateInput, true),
      })
    )}`;
  });

  // Handle edit and delete actions
  $(document).on("click", ".edit-btn", function () {
    const id = $(this).data("id");
    const collection = $(this).data("collection");
    const activeTab = $(".nav-link.active").attr("id");
    const returnUrl = encodeURIComponent(
      `${window.location.pathname}?activeTab=${activeTab}`
    );
    window.location.href = `/frontend/html/addPages.html?collection=${collection}&id=${id}&returnUrl=${returnUrl}`;
  });

  $(document).on("click", ".delete-btn", async function () {
    const id = $(this).data("id");
    const collection = $(this).data("collection");

    if (confirm(`Are you sure you want to delete this ${collection}?`)) {
      try {
        const response = await fetch(`${apiUrl}/${collection}/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error(`Failed to delete ${collection}`);

        alert(`${collection} deleted successfully`);
        loadDataForTab($(".nav-link.active").attr("id"));
      } catch (error) {
        console.error("Delete error:", error);
        alert(`Error deleting ${collection}: ${error.message}`);
      }
    }
  });

  // Check for refresh flag
  if (sessionStorage.getItem("dashboardNeedsRefresh") === "true") {
    sessionStorage.removeItem("dashboardNeedsRefresh");
  }

  // Function to fetch options from referenced collections
  async function fetchOptionsFromCollection(selectElement, collectionName) {
    try {
      const requestBody = {
        filters: {
          _id: selectElement,
        },
      };

      const response = await fetch(`${apiUrl}/filtered/${collectionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const record = data.results[0];
          //return record[`${collectionName}Id`];
          return record;
        } else {
          return undefined;
        }
      }
    } catch (error) {
      console.error("Error fetching options:", error);
      return undefined;
    }
  }

  // Initialize the dashboard
  initializeTabs();
});
