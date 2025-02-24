import {
  getCarTitle,
  checkVehicleAvailability,
  createServerWakeupService,
} from "./utilities.js";

const wakeupService = createServerWakeupService();
wakeupService.start();

let dataRecordID = "";

async function setupBookingFieldsHandling(schema) {
  const carIdField = document.getElementById("CarId");
  const startDateField = document.getElementById("StartDate");
  const returnDateField = document.getElementById("ReturnDate");

  if (!carIdField || !startDateField || !returnDateField) {
    carIdField.disabled = true;
    return;
  }

  const isCarIdReadonly = schema?.CarId?.metadata?.readonly || false;

  // Disable CarId initially if dates are empty
  if (!startDateField.value || !returnDateField.value) {
    carIdField.disabled = !isCarIdReadonly;
  }

  //updateAvailableVehicles();

  async function updateAvailableVehicles() {
    if (!startDateField.value || !returnDateField.value) {
      //carIdField.disabled = !isCarIdReadonly;
      carIdField.disabled = true;
      return;
    }

    carIdField.disabled = false;

    // Fetch all vehicles and filter available ones
    const response = await fetch(
      "https://kittoch-car-hire.onrender.com/api/universalCRUD/list/Vehicle",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { results } = await response.json();

    const currentCar = carIdField.value;

    const availableVehicles = await Promise.all(
      results.map(async (vehicle) => {
        const isAvailable = await checkVehicleAvailability(
          vehicle._id,
          new Date(startDateField.value),
          new Date(returnDateField.value),
          false,
          dataRecordID
        );
        return isAvailable ? vehicle : null;
      })
    );

    // Update CarId options
    let isCurrentVehicle = false;
    carIdField.innerHTML = '<option value="">Select Vehicle</option>';
    availableVehicles
      .filter((v) => v !== null)
      .forEach((vehicle) => {
        const option = document.createElement("option");
        option.value = vehicle._id;
        if (option.value === currentCar) {
          isCurrentVehicle = true;
        }
        option.textContent = getCarTitle(vehicle) || "N/A";
        carIdField.appendChild(option);
      });

    if (isCurrentVehicle) {
      carIdField.value = currentCar;
    } else if (currentCar) {
      alert(
        "Vehicle is not available for selected dates.\nSo, the current vehicle has been removed."
      );
    }
  }

  // Event Listeners
  startDateField.addEventListener("change", updateAvailableVehicles);
  returnDateField.addEventListener("change", updateAvailableVehicles);
}

document.addEventListener("DOMContentLoaded", function () {
  let schema = null;
  const apiUrl = "https://kittoch-car-hire.onrender.com/api/universalCRUD";

  // Get the collection name and record ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const collection = urlParams.get("collection") || "Employee";
  const recordId = urlParams.get("id");

  const returnUrl =
    urlParams.get("returnUrl") ||
    (collection === "Employee" && !recordId
      ? "/"
      : "/frontend/html/dashboard.html");

  const prefillData = urlParams.get("prefill")
    ? JSON.parse(decodeURIComponent(urlParams.get("prefill")))
    : null;

  // Update form title
  const formTitle = document.getElementById("formTitle");
  formTitle.textContent = recordId ? `Edit ${collection}` : `New ${collection}`;

  // Handle back button
  const backButton = document.getElementById("backButton");
  backButton.addEventListener("click", function () {
    window.location.href = decodeURIComponent(returnUrl);
  });
  backButton.textContent =
    returnUrl === "/" ? "Back to Login" : "Back to Dashboard";

  // Function to return to dashboard or login page
  function returnToPage() {
    window.location.href = decodeURIComponent(returnUrl);
  }

  // Function to load settings from local file
  async function loadSettingsFile(filename) {
    try {
      const response = await fetch(`${apiUrl}/settings/${filename}`);
      if (!response.ok) throw new Error("Settings file not found");
      return await response.json();
    } catch (error) {
      console.error("Error loading settings:", error);
      return null;
    }
  }

  // Enhanced function to get nested value from settings using path
  function getValueFromPath(obj, path, parentValue = null) {
    if (!obj || !path) return [];
    const parts = path.split(".");

    // Handle parent-dependent values
    if (parentValue) {
      let current = obj;
      // Navigate to the parent's level
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) return [];
        current = current[parts[i]];
      }

      // Check if parent exists and has the requested field
      const lastPart = parts[parts.length - 1];
      if (current[parentValue]?.[lastPart]) {
        return current[parentValue][lastPart];
      }
      return [];
    }

    // Handle direct path navigation
    let current = obj;
    for (const part of parts) {
      if (!current || typeof current !== "object") return [];
      current = current[part];
    }

    // Return array of values or keys for object
    if (typeof current === "object" && !Array.isArray(current)) {
      return Object.keys(current);
    }

    return Array.isArray(current) ? current : [];
  }

  // Function to create enhanced select with autocomplete
  function createEnhancedSelect(
    fieldName,
    metadata,
    options = [],
    parentField = null,
    schema = null
  ) {
    const wrapper = document.createElement("div");
    wrapper.className = "position-relative";

    const input = document.createElement("input");
    input.type = "text";
    input.id = fieldName;
    input.name = fieldName;
    input.className = "form-control";
    input.placeholder = metadata.placeholder || `Enter ${metadata.label}`;
    input.required = metadata.required || false;
    input.style.cssText = "textAlign: left;";

    const dropdown = document.createElement("ul");
    dropdown.className = "dropdown-menu w-100 position-absolute";
    dropdown.style.cssText =
      "display: none; z-index: 1000; background: white; border: 1px solid #ddd; max-height: 200px; overflow-y: auto;";

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);

    let currentOptions = [...options];

    async function updateOptionsBasedOnParent() {
      try {
        if (parentField) {
          const parentInput = document.getElementById(parentField);
          const parentValue = parentInput?.value;

          if (parentValue) {
            const [filename, pathInFile] = metadata.setting.split("#");
            const settings = await loadSettingsFile(filename);

            if (settings) {
              const parentOptions = getValueFromPath(
                settings,
                pathInFile,
                parentValue
              );

              currentOptions = Array.isArray(parentOptions)
                ? parentOptions
                : [];

              updateDropdown(
                currentOptions.filter((opt) =>
                  opt.toLowerCase().includes(input.value.toLowerCase())
                )
              );
            }
          } else {
            currentOptions = [];
            updateDropdown([]);
          }
        } else if (metadata.setting) {
          // For parent fields, load options directly
          const [filename, pathInFile] = metadata.setting.split("#");
          const settings = await loadSettingsFile(filename);

          if (settings) {
            const values = getValueFromPath(settings, pathInFile);
            currentOptions = Array.isArray(values)
              ? values
              : Object.keys(values);

            updateDropdown(
              currentOptions.filter((opt) =>
                opt.toLowerCase().includes(input.value.toLowerCase())
              )
            );
          }
        }
      } catch (error) {
        console.error(`Error updating options for ${fieldName}:`, error);
      }
    }

    // Show dropdown on focus
    input.addEventListener("focus", async function (e) {
      if (!metadata.readonly) {
        await updateOptionsBasedOnParent();
      }
    });

    // Filter options on input
    input.addEventListener("input", async function (e) {
      if (metadata.readonly) return;

      if (parentField) {
        const parentInput = document.getElementById(parentField);
        if (!parentInput?.value) {
          const parentMetadata = schema[parentField]?.metadata;
          this.value = "";
          alert(`Please select ${parentMetadata?.label || parentField} first`);
          return;
        }
      }

      await updateOptionsBasedOnParent();
    });

    function updateDropdown(matches) {
      dropdown.innerHTML = "";

      if (matches.length > 0) {
        matches.forEach((match) => {
          const li = document.createElement("li");
          li.style.cssText = "padding: 8px 12px; cursor: pointer;";
          li.textContent = match;

          li.addEventListener("click", () => {
            input.value = match;
            dropdown.style.display = "none";
            input.dispatchEvent(new Event("change", { bubbles: true }));
          });

          li.addEventListener("mouseenter", () => {
            li.style.backgroundColor = "#f8f9fa";
          });

          li.addEventListener("mouseleave", () => {
            li.style.backgroundColor = "transparent";
          });

          dropdown.appendChild(li);
        });

        dropdown.style.display = "block";
      } else {
        dropdown.style.display = "none";
      }
    }

    // Handle outside clicks
    document.addEventListener("click", function (e) {
      if (!wrapper.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });

    // Handle parent field changes
    if (parentField) {
      const parentInput = document.getElementById(parentField);
      if (parentInput) {
        parentInput.addEventListener("change", async () => {
          input.value = "";
          await updateOptionsBasedOnParent();
        });
      }
    }

    return wrapper;
  }

  // Function to fetch options from referenced collections
  async function fetchOptionsFromCollection(selectElement, collectionName) {
    try {
      const response = await fetch(`${apiUrl}/list/${collectionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { results } = await response.json();

      results.forEach((item) => {
        const optionElement = document.createElement("option");
        optionElement.value = item._id;
        optionElement.textContent =
          collectionName === "Vehicle"
            ? getCarTitle(item)
            : item[`${collectionName}Id`] || "N/A";
        selectElement.appendChild(optionElement);
      });
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }

  // Fetch schema and populate form
  fetch(`${apiUrl}/schema/${collection}`)
    .then((response) => response.json())
    .then(async (schemaData) => {
      schema = schemaData.obj;
      const formFields = document.getElementById("formFields");

      // Keep track of field dependencies
      const dependentFields = new Map();

      // First pass: identify dependent fields
      for (const [fieldName, field] of Object.entries(schema)) {
        if (field.metadata?.setting) {
          const pathParts = field.metadata.setting.split("#")[1].split(".");
          if (pathParts.length > 2) {
            // For hierarchical fields, the parent is typically the field that comes before
            const parentFieldName = Object.keys(schema).find((key) =>
              schema[key].metadata?.setting?.includes(
                pathParts.slice(0, -1).join(".")
              )
            );
            if (parentFieldName) {
              dependentFields.set(fieldName, parentFieldName);
            }
          }
        }
      }

      // Create form fields based on schema
      for (const [fieldName, field] of Object.entries(schema)) {
        if (
          fieldName !== "_id" &&
          fieldName !== "__v" &&
          fieldName !== "createdAt" &&
          fieldName !== "updatedAt"
        ) {
          const metadata = field.metadata;
          if (!metadata) {
            console.warn(`Metadata not found for field: ${fieldName}`);
            continue;
          }

          const div = document.createElement("div");
          div.className = "form-group";

          const label = document.createElement("label");
          label.htmlFor = fieldName;
          label.textContent = metadata.label;
          div.appendChild(label);

          if (metadata.type === "select" && metadata.setting) {
            // Handle settings-based select field
            const [filename, pathInFile] = metadata.setting.split("#");
            const settings = await loadSettingsFile(filename);
            const parentField = dependentFields.get(fieldName);
            const options = settings
              ? getValueFromPath(settings, pathInFile)
              : [];

            const enhancedSelect = createEnhancedSelect(
              fieldName,
              metadata,
              options,
              parentField,
              schema
            );
            enhancedSelect.style.cssText = "text-align: start;";
            div.appendChild(enhancedSelect);
          } else if (metadata.type === "select") {
            // Handle regular select field
            const select = document.createElement("select");
            select.id = fieldName;
            select.name = fieldName;
            select.className = "form-control";
            select.style.cssText = "text-align: left;";

            select.required = metadata.required;

            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = `Select ${metadata.label}`;
            defaultOption.style.cssText = "text-align: left;";
            select.appendChild(defaultOption);

            if (field.ref) {
              await fetchOptionsFromCollection(select, field.ref);
            }

            div.appendChild(select);
          } else {
            // Handle other input types
            if (metadata.type === "checkbox") {
              const checkboxWrapper = document.createElement("div");
              checkboxWrapper.className = "form-check";
              checkboxWrapper.style.cssText = "text-align: start";

              const input = document.createElement("input");
              input.type = "checkbox";
              input.id = fieldName;
              input.name = fieldName;
              input.className = "form-check-input";
              input.required = metadata.required;
              input.style.cssText = "text-align: start;";

              if (metadata.readonly) {
                input.disabled = true;
                input.style.cursor = "not-allowed";
              }

              const checkboxLabel = document.createElement("label");
              checkboxLabel.className = "form-check-label";
              checkboxLabel.htmlFor = fieldName;
              checkboxLabel.style.cssText = "text-align: start";
              checkboxLabel.textContent =
                metadata.placeholder || metadata.label;

              checkboxWrapper.appendChild(input);
              checkboxWrapper.appendChild(checkboxLabel);
              div.appendChild(checkboxWrapper);
            } else {
              const input = document.createElement("input");
              input.type = metadata.type;
              input.id = fieldName;
              input.name = fieldName;
              input.placeholder = metadata.placeholder;
              input.className = "form-control";
              input.required = metadata.required;
              input.style.cssText =
                "text-align: start; display: flex; justify-content: start;";

              if (metadata.readonly) {
                input.disabled = true;
                input.style.backgroundColor = "#e9ecef";
                input.style.cursor = "not-allowed";
              }

              if (metadata.step) {
                input.step = metadata.step;
              }

              div.appendChild(input);
            }
          }

          formFields.appendChild(div);
        }
      }

      // If editing, fetch and populate existing data
      if (recordId) {
        try {
          const requestBody = {
            filters: {
              [`${collection}Id`]: recordId,
            },
          };

          const response = await fetch(`${apiUrl}/filtered/${collection}`, {
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
              dataRecordID = record._id;

              // Populate form fields with the record data
              for (const [key, value] of Object.entries(record)) {
                const element = document.getElementById(key);
                if (element) {
                  if (element.type === "checkbox") {
                    element.checked = value;
                  } else if (element.type === "date" && value) {
                    element.value = new Date(value).toISOString().split("T")[0];
                  } else if (element.tagName === "SELECT") {
                    element.value = value || "";
                  } else if (
                    element.type === "text" &&
                    element.closest(".position-relative")
                  ) {
                    const storageKey = `customValues_${key}`;
                    const storedOptions = JSON.parse(
                      localStorage.getItem(storageKey) || "[]"
                    );
                    if (!storedOptions.includes(value) && value) {
                      storedOptions.push(value);
                      localStorage.setItem(
                        storageKey,
                        JSON.stringify(storedOptions)
                      );
                    }
                    element.value = value || "";
                    element.style.cssText = "text-align: start";

                    // Trigger change event for parent fields
                    if (value) {
                      const event = new Event("change", { bubbles: true });
                      element.dispatchEvent(event);
                    }
                  } else {
                    element.value = value || "";
                  }
                }
              }
            } else {
              console.error("No records found for ID:", recordId);
              alert("Record not found");
            }
          } else {
            const errorText = await response.text();
            console.error("Server error:", response.status, errorText);
            alert("Error loading record data");
          }
        } catch (error) {
          console.error("Fetch error:", error);
          alert("Error connecting to server");
        }
      }

      // handling after form fields are created
      if (prefillData) {
        Object.entries(prefillData).forEach(([key, value]) => {
          const element = document.getElementById(key);
          if (element) {
            element.value = value;

            // Trigger change event for any dependent fields
            element.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      }

      if (collection === "Booking") {
        await setupBookingFieldsHandling(schema);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error loading form data. Please try again.");
    });

  // Function to add value to array if not exists
  function addUniqueValue(array, value) {
    if (!Array.isArray(array)) array = [];
    return array.includes(value) ? false : array.push(value);
  }

  // Function to handle nested value addition with parent-child relationships
  function addNestedValue(obj, path, value, parentValue = null) {
    const pathParts = path.split(".");
    let current = obj;
    let modified = false;

    // Handle parent-child relationship case
    if (parentValue) {
      // Ensure parent exists with proper structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];

        if (!current[part]) {
          current[part] = {};
        }

        // If it's the parent level and we have a parent value
        if (i === pathParts.length - 2) {
          if (!current[part][parentValue]) {
            current[part][parentValue] = {};
          }
          current = current[part][parentValue];
        } else {
          current = current[part];
        }
      }

      // Add the child value
      const lastPart = pathParts[pathParts.length - 1];
      if (!current[lastPart]) {
        current[lastPart] = [];
      }
      modified = addUniqueValue(current[lastPart], value);
    } else {
      // Standard nested path handling
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isLast = i === pathParts.length - 1;

        if (!current[part]) {
          current[part] = isLast ? [] : {};
        }

        if (isLast) {
          modified = addUniqueValue(current[part], value);
        } else {
          current = current[part];
        }
      }
    }

    return modified;
  }

  // Updated function for saving settings
  async function saveSettingsFile(filename, updates) {
    try {
      const currentSettings = await loadSettingsFile(filename);
      if (!currentSettings) throw new Error("Unable to load current settings");

      let hasChanges = false;

      // Process all updates
      for (const [path, value] of updates) {
        // Check if this is a child value that needs parent context
        const pathParts = path.split(".");
        const parentPath = pathParts.slice(0, -1).join(".");
        const parentUpdates = Array.from(updates).find(
          ([p, _]) => p === parentPath
        );

        const modified = parentUpdates
          ? addNestedValue(currentSettings, path, value, parentUpdates[1])
          : addNestedValue(currentSettings, path, value);

        hasChanges = hasChanges || modified;
      }

      if (hasChanges) {
        const response = await fetch(`${apiUrl}/settings/${filename}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentSettings),
        });

        if (!response.ok) throw new Error(await response.text());
        return await response.json();
      }

      return currentSettings;
    } catch (error) {
      console.error("Error saving settings:", error);
      return null;
    }
  }

  // Function to update settings file with new values
  async function updateSettingsWithNewValues(formData) {
    if (!schema) return;

    const fieldsWithSettings = Object.entries(schema).filter(
      ([_, field]) =>
        field.metadata?.type === "select" && field.metadata?.setting
    );

    const settingsUpdates = new Map();

    for (const [fieldName, field] of fieldsWithSettings) {
      const fieldValue = formData[fieldName];
      if (!fieldValue) continue;

      const [filename, path] = field.metadata.setting.split("#");

      if (!settingsUpdates.has(filename)) {
        settingsUpdates.set(filename, new Map());
      }
      const fileUpdates = settingsUpdates.get(filename);

      // Handle parent-child relationships
      const parentField = Object.entries(schema).find(([_, otherField]) => {
        if (!otherField.metadata?.setting) return false;
        const [parentFile, parentPath] = otherField.metadata.setting.split("#");
        return (
          parentFile === filename &&
          path.startsWith(parentPath) &&
          path !== parentPath
        );
      });

      if (parentField) {
        const [parentName] = parentField;
        const parentValue = formData[parentName];
        if (parentValue) {
          const pathParts = path.split(".");
          const basePathParts = pathParts.slice(0, -1);
          const lastPart = pathParts[pathParts.length - 1];
          fileUpdates.set(`${basePathParts.join(".")}.${lastPart}`, fieldValue);
        }
      } else {
        fileUpdates.set(path, fieldValue);
      }
    }

    for (const [filename, updates] of settingsUpdates) {
      try {
        await saveSettingsFile(filename, updates);
      } catch (error) {
        console.error(`Error updating settings for ${filename}:`, error);
      }
    }
  }

  // Handle form submission
  document
    .getElementById("universalForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = {};
      const inputs = this.querySelectorAll("input, select");
      inputs.forEach((input) => {
        if (input.type === "checkbox") {
          formData[input.name] = input.checked;
        } else {
          formData[input.name] = input.value;
        }
      });

      try {
        // Update settings file if needed
        await updateSettingsWithNewValues(formData);

        const method = recordId ? "PUT" : "POST";
        const url = recordId
          ? `${apiUrl}/${collection}/${dataRecordID}`
          : `${apiUrl}/${collection}`;

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          alert("Record saved successfully");
          returnToPage();
        } else {
          const error = await response.json();
          alert(error.message || "Error saving data");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Server error. Please try again later.");
      }
    });
});
