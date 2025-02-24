/* export function shiftData(currData, days, isInc) {
  let returnData = new Date(currData);
  const shiftDays = isInc ? days : -days;
  returnData.setDate(currData.getDate() + shiftDays);
  return returnData;
}
 */

// Configuration
const CONFIG = {
  API_URL: "https://kittoch-car-hire.onrender.com",
  PING_INTERVAL: 30 * 1000, // 30 seconds
  PING_TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
};

/**
 * Universal ping function that can be used across different modules
 * @returns {Promise<boolean>} - Returns true if ping was successful
 */
export async function pingServer() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.PING_TIMEOUT);

    const response = await fetch(`${CONFIG.API_URL}/api/universalCRUD/ping`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn("Server ping failed:", error.message);
    return false;
  }
}

/**
 * Creates a ping interval that keeps the server awake
 * @param {number} interval - Ping interval in milliseconds (optional)
 * @param {Function} onSuccess - Callback for successful pings (optional)
 * @param {Function} onError - Callback for failed pings (optional)
 * @returns {Object} Controller object with start/stop methods
 */
export function createServerWakeupService(
  interval = CONFIG.PING_INTERVAL,
  onSuccess = null,
  onError = null
) {
  let pingInterval = null;
  let isRunning = false;

  const pingWithRetry = async (retries = CONFIG.MAX_RETRIES) => {
    for (let i = 0; i < retries; i++) {
      if (await pingServer()) {
        onSuccess?.();
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
    onError?.();
    return false;
  };

  return {
    start() {
      if (isRunning) return;
      isRunning = true;
      pingInterval = setInterval(pingWithRetry, interval);
      // Initial ping
      pingWithRetry();
    },
    stop() {
      if (!isRunning) return;
      isRunning = false;
      clearInterval(pingInterval);
    },
    isRunning() {
      return isRunning;
    },
    forcePing() {
      return pingWithRetry();
    },
  };
}

export function getCarTitle(car) {
  return `${car.VehicleId} ${car.Make} ${car.Model}`;
}

/**
 * Checks vehicle availability for a given date range or single date
 * @param {string} recordId - Vehicle ID to check
 * @param {Date|null} startDate - Start date of the period (optional)
 * @param {Date|null} endDate - End date of the period (optional)
 * @param {inside|null} boolean - Either only startDate or endDate must be specified (optional)
 *        - If true, the specified date is between startDate and endDate
 *        - If false, the specified date is outside the range from startDate to endDate
 * @returns {Promise<boolean>} - Returns true if vehicle is available
 */
export async function checkVehicleAvailability(
  recordId,
  startDate = null,
  endDate = null,
  inside = true,
  ignoreRecordId = ""
) {
  const collection = "Booking";
  const apiUrl = "https://kittoch-car-hire.onrender.com/api/universalCRUD";

  const startPeriodDate = startDate
    ? (() => {
        const now = new Date(startDate);
        now.setHours(0, 0, 0, 0);
        return now;
      })()
    : (() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
      })();

  const endPeriodDate = endDate
    ? (() => {
        const now = new Date(endDate);
        now.setHours(23, 59, 59, 999);
        return now;
      })()
    : (() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        return now;
      })();

  /*   const dayCounter = 365;
  const currentDataStartPeriod = shiftData(startPeriodDate, dayCounter, false);
  const currentDataEndPeriod = shiftData(endPeriodDate, dayCounter, true);
 */

  let bodyJSON = null;

  if (startDate && endDate) {
    // Period check
    const dateRanges = {
      StartDate: {
        start: startPeriodDate,
        end: endPeriodDate,
      },
      ReturnDate: {
        start: startPeriodDate,
        end: endPeriodDate,
      },
    };

    bodyJSON = JSON.stringify({
      filters: {
        CarId: recordId,
        insideDateRanges: inside,
      },
      dateRanges,
      ignoreRecord: ignoreRecordId,
    });
  } else {
    const queryDate = startPeriodDate ? startPeriodDate : endPeriodDate;
    const queryAvailable = inside ? "noAvailableDate" : "availableDate";

    bodyJSON = JSON.stringify({
      filters: {
        CarId: recordId,
        [queryAvailable]: queryDate,
      },
      ignoreRecord: ignoreRecordId,
    });
  }

  // for debugging
  //console.log(JSON.stringify(bodyJSON, null, 4));

  try {
    const response = await fetch(`${apiUrl}/filtered/${collection}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyJSON,
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return !(data.results && data.results.length > 0);
  } catch (error) {
    console.error("Availability check failed:", error);
    throw error;
  }
}

// Helper function to format dates
export function formatDate(dateString, ISO = false) {
  if (!dateString) return "";
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear(); // Год

  return ISO ? `${year}-${month}-${day}` : `${month}-${day}-${year}`;
}
