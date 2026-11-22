import jwt from "jsonwebtoken";
import User from "../models/User.js";
export function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "30d" });
}
function extractToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}
export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: "Please sign in to continue." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: "Please sign in to continue." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}
export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (token) req.user = await User.findById(jwt.verify(token, process.env.JWT_SECRET).sub);
  } catch { /* ignore invalid/expired token for optional auth */ }
  next();
}
