import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { AppError } from "../utils/AppError";

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only JPEG, PNG, WEBP, and GIF images are allowed.", 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post("/", requireAuth, upload.single("file"), (req: AuthedRequest, res: Response) => {
  if (!req.file) {
    throw new AppError("No file uploaded.", 400);
  }

  const host = req.protocol + "://" + req.get("host");
  const relativeUrl = `/uploads/${req.file.filename}`;
  const fullUrl = `${host}${relativeUrl}`;

  res.status(201).json({
    success: true,
    filename: req.file.filename,
    url: fullUrl,
    relativeUrl,
  });
});

export default router;
