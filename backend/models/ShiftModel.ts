import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ShiftModel {
  static async closeShift(shift: string): Promise<void> {
    const dbPath = path.resolve(__dirname, "../app.db");

    const backUpPath =
      "C:\Users\Prii-\Documents\repos\falco-backups";

    if (!fs.existsSync(backUpPath)) {
      fs.mkdirSync(backUpPath, { recursive: true });
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const backupFileName = `falco_dump_${yyyy}-${mm}-${dd}-${shift}.db`;

    const dest = path.join(backUpPath, backupFileName);

    try {
      fs.copyFileSync(dbPath, dest);
      console.log(`Backup created successfully at ${dest}`);
      return;
    } catch (error) {
      console.error("Error creating backup:", error);
      throw error;
    }
  }
}

export default ShiftModel;
