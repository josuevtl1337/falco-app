interface Props {}
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TabsContent, TabsList, TabsTrigger, Tabs } from "@/components/ui/tabs";
import CalibrationTab from "./cmp/calibration-tab";
import AddCoffeeTab from "./cmp/add-coffee-tab";
import CalibrationHistoryTab from "./cmp/history-tab";

function CalibrationPage(props: Props) {
  const {} = props;

  return (
    <main className="container">
      <div>
        <Tabs defaultValue="history">
          <TabsList className="flex-col justify-between mb-4 md:flex-row w-full">
            <h1 className="p-2 text-md font-semibold">Calibracion</h1>

            <div>
              <TabsTrigger value="calibration">Cata</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
              <TabsTrigger value="coffees">Cafes</TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="calibration">
            <CalibrationTab />
          </TabsContent>

          <TabsContent value="history">
            <CalibrationHistoryTab />
          </TabsContent>

          <TabsContent value="coffees">
            <AddCoffeeTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

export default CalibrationPage;
