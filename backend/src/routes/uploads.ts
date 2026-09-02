import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { requireAuth } from "../middleware/auth.js";
import { ok } from "../utils/http.js";

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]+/g, "-")}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
});

export const uploadRoutes = Router();
uploadRoutes.use(requireAuth);
uploadRoutes.post("/", upload.single("file"), (req, res) => ok(res, { url: `/uploads/${path.basename(req.file!.path)}` }, 201));
