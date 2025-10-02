import AsyncStorage from "@react-native-async-storage/async-storage";

export const addToHistory = async (video: any) => {
  try {
    const history = await AsyncStorage.getItem("watchHistory");
    let historyList = history ? JSON.parse(history) : [];

    // avoid duplicates → remove if already exists
    historyList = historyList.filter((item: any) => item.id !== video.id);

    // add to the top
    historyList.unshift({
      ...video,
      watchedAt: new Date().toISOString(),
    });

    // keep only last 20
    if (historyList.length > 20) historyList.pop();

    await AsyncStorage.setItem("watchHistory", JSON.stringify(historyList));
  } catch (err) {
    console.error("Error saving to history:", err);
  }
};
