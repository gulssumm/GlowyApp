import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { logoutUser as apiLogoutUser } from "@/api";
import { Alert } from "react-native";

export function useLogout() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await apiLogoutUser();
            await logout();
            router.replace("/welcome");
          } catch (error) {
            console.error("Logout error:", error);
          }
          await logout();
          router.replace("/welcome");
        }
      }
    ]);
  };

  return handleLogout;
}