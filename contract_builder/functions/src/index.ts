import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// GET /dives?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export const getDivesByDate = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*"); // allow all (adjust later if needed)
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate and endDate are required" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const snapshot = await db
      .collection("dives")
      .where("date", ">=", start)
      .where("date", "<=", end)
      .get();

    const dives = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ dives });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
