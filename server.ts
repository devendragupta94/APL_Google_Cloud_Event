import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // In-memory state for the demo
  let orders: any[] = [];
  let vendors: any[] = [
    { id: "v1", name: "Amit (East)", location: "Gate 1", status: "idle" },
    { id: "v2", name: "Rahul (West)", location: "Gate 5", status: "idle" },
    { id: "v3", name: "Suresh (North)", location: "Gate 8", status: "idle" },
    { id: "v4", name: "Priya (South)", location: "Gate 3", status: "idle" },
    { id: "v5", name: "Vikram (East)", location: "Gate 2", status: "idle" },
    { id: "v6", name: "Deepak (West)", location: "Gate 7", status: "idle" },
    { id: "v7", name: "Anil (North)", location: "Gate 9", status: "idle" },
    { id: "v8", name: "Sunita (South)", location: "Gate 4", status: "idle" },
    { id: "v9", name: "Rajesh (Central)", location: "Gate 10", status: "idle" },
    { id: "v10", name: "Kunal (East)", location: "Gate 2", status: "idle" },
  ];

  // API routes
  app.get("/api/state", (req, res) => {
    res.json({ orders, vendors });
  });

  app.post("/api/orders", (req, res) => {
    const { items, seat, block, landmark, customerName, customerPhone } = req.body;
    const totalPrepTime = Math.max(...items.map((i: any) => i.avgPrepTime), 0);
    
    const newOrder = {
      id: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      items,
      seat,
      block,
      landmark,
      customerName,
      customerPhone,
      status: "pending",
      createdAt: new Date().toISOString(),
      estimatedPrepTime: totalPrepTime,
    };
    orders.push(newOrder);
    res.json(newOrder);
  });

  app.post("/api/orders/:id/update-landmark", (req, res) => {
    const { id } = req.params;
    const { landmark } = req.body;
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex > -1) {
      orders[orderIndex].landmark = landmark;
      res.json(orders[orderIndex]);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.post("/api/orders/:id/update-status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex > -1) {
      orders[orderIndex].status = status;
      res.json(orders[orderIndex]);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.post("/api/orders/:id/admin-message", (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex > -1) {
      orders[orderIndex].adminMessage = message;
      res.json(orders[orderIndex]);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.post("/api/orders/:id/feedback", (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex > -1) {
      orders[orderIndex].feedback = { rating, comment };
      res.json(orders[orderIndex]);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.post("/api/orders/:id/assign-vendor", (req, res) => {
    const { id } = req.params;
    const { vendorId } = req.body;
    const orderIndex = orders.findIndex(o => o.id === id);
    const vendorIndex = vendors.findIndex(v => v.id === vendorId);
    
    if (orderIndex > -1 && vendorIndex > -1) {
      orders[orderIndex].vendorId = vendorId;
      vendors[vendorIndex].status = "assigned";
      res.json({ order: orders[orderIndex], vendor: vendors[vendorIndex] });
    } else {
      res.status(404).json({ error: "Order or Vendor not found" });
    }
  });

  app.post("/api/vendors/:id/update-status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const vendorIndex = vendors.findIndex(v => v.id === id);
    if (vendorIndex > -1) {
      vendors[vendorIndex].status = status;
      res.json(vendors[vendorIndex]);
    } else {
      res.status(404).json({ error: "Vendor not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
