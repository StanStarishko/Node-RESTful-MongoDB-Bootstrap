const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const fs = require("fs/promises");
const path = require("path");
const SETTINGS_DIR = path.join(__dirname, "../../frontend/settings");

// Model Registration
const Booking = require("../models/Booking");
const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");

// CORS Middleware
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle OPTIONS method
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Request logging middleware
router.use((req, res, next) => {
  console.log("Incoming request:", {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    body: req.body,
    query: req.query,
  });
  next();
});

// for Server Wake Up
router.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Universal CRUD Routes for collections
 */

/**
 * Enhanced filter route with advanced querying capabilities
 * Supports:
 * - Date range queries with OR/AND logic based on insideDateRanges parameter:
 *   - insideDateRanges: true (default) - returns records where any date falls within its range
 *   - insideDateRanges: false - returns records where both dates are outside the StartDate.start to ReturnDate.end period
 * - Single date availability filtering:
 *   - noAvailableDate: finds records where date is within StartDate and ReturnDate
 *   - availableDate: finds records where date is outside StartDate and ReturnDate
 * - Record exclusion/inclusion based on ignoreRecord and insideDateRanges
 * - Pagination
 * - Sorting
 * - Field selection
 * - Text search
 */
router.post("/filtered/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const {
      filters = {},
      dateRanges = {},
      insideDateRanges = true,
      page = 0,
      limit = 0,
      sortBy = {},
      fields = [],
      search = "",
      ignoreRecord = "",
    } = req.body;

    if (!mongoose.models[collection]) {
      return res.status(404).json({
        error: `Collection ${collection} not found`,
        availableCollections: Object.keys(mongoose.models),
      });
    }

    const Model = mongoose.model(collection);
    let query = {};

    // Handle ignoreRecord based on insideDateRanges
    if (ignoreRecord) {
      if (insideDateRanges) {
        query._id = { $ne: ignoreRecord };
      } else {
        query._id = ignoreRecord;
      }
    }

    // Add basic filters
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        if (key === "noAvailableDate" || key === "availableDate") {
          return;
        }
        query[key] = filters[key];
      }
    });

    // Handle availability date filters
    if (filters.noAvailableDate) {
      const date = new Date(filters.noAvailableDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      query.$and = [
        { StartDate: { $lte: endOfDay } },
        { ReturnDate: { $gte: startOfDay } },
      ];
    } else if (filters.availableDate) {
      const date = new Date(filters.availableDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      query.$or = [
        { StartDate: { $gt: endOfDay } },
        { ReturnDate: { $lt: startOfDay } },
      ];
    }

    // Handle date range filters with inside/outside logic
    if (Object.keys(dateRanges).length > 0) {
      const startDate = dateRanges.StartDate?.start
        ? new Date(dateRanges.StartDate.start)
        : null;
      const endDate = dateRanges.ReturnDate?.end
        ? new Date(dateRanges.ReturnDate.end)
        : null;

      if (startDate && endDate) {
        if (insideDateRanges) {
          // Include records where any date falls within its range
          const dateQueries = Object.keys(dateRanges)
            .map((dateField) => {
              const { start, end } = dateRanges[dateField];
              if (start || end) {
                const dateQuery = {};
                if (start) dateQuery[dateField] = { $gte: new Date(start) };
                if (end) {
                  dateQuery[dateField] = {
                    ...dateQuery[dateField],
                    $lte: new Date(end),
                  };
                }
                return dateQuery;
              }
              return null;
            })
            .filter((q) => q !== null);

          if (dateQueries.length > 0) {
            query = {
              ...query,
              ...(query.$and
                ? { $and: [...query.$and, { $or: dateQueries }] }
                : { $or: dateQueries }),
            };
          }
        } else {
          // Include records where both dates are outside the entire period
          query = {
            ...query,
            ...(query.$and
              ? {
                  $and: [
                    ...query.$and,
                    {
                      $or: [
                        { StartDate: { $lt: startDate } },
                        { StartDate: { $gt: endDate } },
                      ],
                    },
                    {
                      $or: [
                        { ReturnDate: { $lt: startDate } },
                        { ReturnDate: { $gt: endDate } },
                      ],
                    },
                  ],
                }
              : {
                  $and: [
                    {
                      $or: [
                        { StartDate: { $lt: startDate } },
                        { StartDate: { $gt: endDate } },
                      ],
                    },
                    {
                      $or: [
                        { ReturnDate: { $lt: startDate } },
                        { ReturnDate: { $gt: endDate } },
                      ],
                    },
                  ],
                }),
          };
        }
      }
    }

    // Add text search if provided
    if (search) {
      const searchFields = Model.schema.obj;
      const searchQueries = Object.keys(searchFields)
        .filter((field) =>
          ["String", "Number"].includes(searchFields[field].type?.name)
        )
        .map((field) => ({ [field]: new RegExp(search, "i") }));

      if (searchQueries.length > 0) {
        query = {
          ...query,
          ...(query.$and
            ? { $and: [...query.$and, { $or: searchQueries }] }
            : { $or: searchQueries }),
        };
      }
    }

    const sort = {};
    Object.keys(sortBy).forEach((field) => {
      sort[field] = sortBy[field] === "desc" ? -1 : 1;
    });

    const skip = (page - 1) * limit;
    const fieldSelection = fields.length > 0 ? fields.join(" ") : "";

    const results = await Model.find(query)
      .select(fieldSelection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Model.countDocuments(query);

    res.status(200).json({
      results,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Filter endpoint error:", error);
    res.status(500).json({
      error: error.message,
      details: "Server error in filtered endpoint",
    });
  }
});

// Get model parameters
router.get("/schema/:model", async (req, res) => {
  const modelName = req.params.model;
  const Model = mongoose.model(modelName);
  res.json(Model.schema);
});

// Add a new document to the specified collection
router.post("/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const Model = mongoose.model(collection);

    // Auto-generate ID for Booking
    if (collection === "Booking") {
      const { CustomerId, StartDate } = req.body;

      // Validate required fields
      if (!CustomerId || !StartDate) {
        return res.status(400).json({
          error: "CustomerId and StartDate are required for Booking.",
        });
      }

      // Format StartDate to YYYY-MM-DD
      const formattedDate = new Date(StartDate).toISOString().split("T")[0];

      // Count existing bookings for the customer on the same date
      const bookingCount = await Model.countDocuments({
        CustomerId,
        StartDate,
      });
      const bookingNum = String(bookingCount + 1).padStart(3, "0");

      // Generate the Booking ID
      req.body.BookingId = `${CustomerId}_${formattedDate}_${bookingNum}`;
    }

    const newDocument = new Model(req.body);
    const result = await newDocument.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get documents from the specified collection with pagination and sorting
 * Accepts in body:
 * - page (default: 0) - page number
 * - limit (default: 0) - items per page
 * - sortBy (default: {}) - sorting configuration, e.g., { "field": "asc"|"desc" }
 * - fields (default: []) - fields to return in response
 */
router.post("/list/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const { page = 0, limit = 0, sortBy = {}, fields = [] } = req.body;

    if (!mongoose.models[collection]) {
      return res.status(404).json({
        error: `Collection ${collection} not found`,
        availableCollections: Object.keys(mongoose.models),
      });
    }

    const Model = mongoose.model(collection);
    const skip = (page - 1) * limit;

    // Configure sorting
    const sort = {};
    Object.keys(sortBy).forEach((field) => {
      sort[field] = sortBy[field] === "desc" ? -1 : 1;
    });

    const fieldSelection = fields.length > 0 ? fields.join(" ") : "";

    // Get paginated and sorted results
    const results = await Model.find()
      .select(fieldSelection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Model.countDocuments();

    res.status(200).json({
      results,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get collection endpoint error:", error);
    res.status(500).json({
      error: error.message,
      details: "Server error in get collection endpoint",
    });
  }
});

// Update a document in the specified collection
router.put("/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params;
    const Model = mongoose.model(collection);
    const updatedDocument = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(200).json(updatedDocument);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a document from the specified collection
router.delete("/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params;
    const Model = mongoose.model(collection);
    const deletedDocument = await Model.findByIdAndDelete(id);
    if (!deletedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(200).json(deletedDocument);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get settings
router.get("/settings/:filename", async (req, res) => {
  try {
    const filePath = path.join(SETTINGS_DIR, req.params.filename);
    console.log("Saving settings to:", filePath);
    const data = await fs.readFile(filePath, "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading settings:", error);
    res.status(404).json({ error: "Settings file not found" });
  }
});

// Saving settings
router.post("/settings/:filename", async (req, res) => {
  try {
    const filePath = path.join(SETTINGS_DIR, req.params.filename);
    console.log("Saving settings to:", filePath);
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), "utf8");
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

module.exports = router;
