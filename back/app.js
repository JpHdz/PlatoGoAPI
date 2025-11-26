// Import required modules and middleware
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

// Import routers
const usersRouter = require("./routes/userRoutes");
const categoryRouter = require("./routes/categoryRoutes");
const orderRouter = require("./routes/orderRoutes");
const productRouter = require("./routes/productRoutes");
const restaurantRouter = require("./routes/restaurantRoutes");
const tableRouter = require("./routes/tableRoutes");
const viewRouter = require("./routes/viewRoutes");
const modifierRouter = require("./routes/modifierRoutes");

// Initialize express app
const app = express();

// Set security HTTP headers
app.use(helmet());
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// Content Security Policy configuration
const scriptSrcUrls = [
  "https://unpkg.com/",
  "https://tile.openstreetmap.org",
  "https://js.stripe.com/v3/",
];
const styleSrcUrls = [
  "https://unpkg.com/",
  "https://tile.openstreetmap.org",
  "https://fonts.googleapis.com/",
  "https://checkout.stripe.com",
];
const connectSrcUrls = [
  "https://unpkg.com",
  "https://tile.openstreetmap.org",
  "*.stripe.com",
];
const fontSrcUrls = ["fonts.googleapis.com", "fonts.gstatic.com"];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: ["'self'", "blob:", "data:", "https:"],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ["*.stripe.com", "*.stripe.network"],
    },
  })
);

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Enable CORS for frontend (DEBE IR ANTES del rate limiter y body parser)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
  })
);

// Responder a preflight OPTIONS para todas las rutas
app.options("*", cors());

// Limit requests from same API (rate limiting)
// COMENTADO TEMPORALMENTE PARA TESTING
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message: "Too many requests from this IP, please try again in an hour!",
// });
// app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Data sanitization against NOSQL query injection
app.use(mongoSanitize());

// Data sanitization against XXS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    // Allow duplicate fields
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// Enable gzip compression for responses
app.use(compression());

// Test middleware to add request time
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Health check endpoint for ALB
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is healthy",
  });
});

// API routes
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/table", tableRouter);
app.use("/api/v1/modifiers", modifierRouter);

// View engine and static files
app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);
app.use(express.static(`${__dirname}/public`));
app.use("/", viewRouter);

// Handle all undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

// Export express app
module.exports = app;
