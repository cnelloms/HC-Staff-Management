app.get("/api/profile", (req, res) => {
  // req.user should have been set by replitAuth.ts
  if (!req.user) {
    return res.status(404).json({ message: "No profile found" });
  }
  // Only return the fields you need on the client
  const { id, firstName, lastName, email, isAdmin, isEnabled } = req.user;
  return res.json({ id, firstName, lastName, email, isAdmin, isEnabled });
});
