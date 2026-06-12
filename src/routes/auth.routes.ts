import { Router } from "express";
import { getCurrentAdmin, login } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.get("/me", authenticate, getCurrentAdmin);

export default router;
