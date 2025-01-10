import {
  ActivityIndicator,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

type ButtonProps = {
  onPress: () => void;
  isWifiOn: boolean;
  isLoading: boolean;
};

export default function HighlightButton({
  onPress,
  isWifiOn,
  isLoading,
}: ButtonProps) {
  return (
    <TouchableHighlight
      style={[styles.button]}
      onPress={onPress}
      underlayColor={
        isWifiOn ? "rgba(86, 163, 62, 0.25) " : "rgba(219, 15, 15, 0.25)"
      }
      disabled={isLoading}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Icon
            name="power-off"
            size={125}
            color={isWifiOn ? "#56a33e" : "#db0f0f"}
          />
        )}
      </View>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 150,
    height: 150,
    margin: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 75,
    borderColor: "slategray",
  },

  content: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
});
