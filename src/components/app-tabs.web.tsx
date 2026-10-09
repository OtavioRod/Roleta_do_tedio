import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import { Pressable, StyleSheet, View } from "react-native";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />

      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton />
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ ...props }: TabTriggerSlotProps) {
  return <Pressable {...props} style={styles.hiddenButton} />;
}

export function CustomTabList(props: TabListProps) {
  return <View {...props} style={styles.hiddenTabList} />;
}

const styles = StyleSheet.create({
  hiddenTabList: {
    display: "none",
  },

  hiddenButton: {
    display: "none",
  },
});
