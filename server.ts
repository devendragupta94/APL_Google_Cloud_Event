import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory state for the demo
  let orders: any[] = [];
  let vendors: any[] = [
    { id: "v1", name: "Amit", location: "Block A", status: "idle" },
    { id: "v2", name: "Rahul", location: "Block C", status: "idle" },
    { id: "v3", name: "Suresh", location: "Block F", status: "idle" },
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
