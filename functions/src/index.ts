import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import type {Request, Response} from "express";

admin.initializeApp();
const db = admin.firestore();

type FirestoreDoc = admin.firestore.QueryDocumentSnapshot;

type AggregatedDive = {
  id: string;
  date: string;
  diveNumber: number;
  boat: string;
  diveGuides: string[];
  diveSite: string;
};

// GET /dives?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export const getDivesByDate = functions.https.onRequest(
  async (req: Request, res: Response) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const {startDate, endDate} = req.query as {
        startDate?: string;
        endDate?: string;
      };

      if (!startDate || !endDate) {
        res.status(400).json({error: "startDate and endDate are required"});
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // --- Pull dives in range ---
      const divesSnap = await db
        .collection("dives")
        .where("date", ">=", start)
        .where("date", "<=", end)
        .get();

      // --- Pull boats + sites for lookups ---
      const [boatsSnap, sitesSnap] = await Promise.all([
        db.collection("boats").get(),
        db.collection("sites").get(),
      ]);

      const boatMap: Record<string, string> = {};
      boatsSnap.forEach((doc: FirestoreDoc) => {
        const b = doc.data();
        boatMap[doc.id] = b.name || doc.id;
      });

      const siteMap: Record<string, string> = {};
      sitesSnap.forEach((doc: FirestoreDoc) => {
        const s = doc.data();
        siteMap[doc.id] = s.name || doc.id;
      });

      // --- Slot → number mapping ---
      const slotToNumber = (slot: string) => {
        switch (slot) {
          case "9am":
            return 1;
          case "11am":
            return 2;
          case "1pm":
            return 3;
          case "4pm":
            return 4;
          case "night":
            return 5;
          default:
            return 0;
        }
      };

      // --- Aggregate dives by date + slot + boat ---
      const aggregated: Record<string, AggregatedDive> = {};

      divesSnap.docs.forEach((doc: FirestoreDoc) => {
        const data = doc.data();

        const dateStr = data.date?.toDate ?
          data.date.toDate().toISOString().split("T")[0] :
          data.date;

        const diveNumber = slotToNumber(data.diveSlot);
        const boatName = boatMap[data.boatId] || data.boatId;
        const siteName = siteMap[data.diveSiteId] || data.diveSiteId;

        // Composite key: same dive if date + number + boat match
        const key = `${dateStr}-${diveNumber}-${boatName}`;

        if (!aggregated[key]) {
          aggregated[key] = {
            id: doc.id,
            date: dateStr,
            diveNumber,
            boat: boatName,
            diveGuides: [String(data.diveGuide)],
            diveSite: siteName,
          };
        } else {
          // Add guide if not already listed
          if (!aggregated[key].diveGuides.includes(String(data.diveGuide))) {
            aggregated[key].diveGuides.push(String(data.diveGuide));
          }
        }
      });

      // Turn back into array
      const dives = Object.values(aggregated);

      res.json({dives});
    } catch (err) {
      console.error(err);
      res.status(500).json({error: "Internal server error"});
    }
  }
);
