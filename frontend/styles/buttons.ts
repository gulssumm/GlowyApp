import { StyleSheet } from "react-native";

export const ButtonStyles = StyleSheet.create({
  primary: {
    backgroundColor: "#800080",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  warning: {
    backgroundColor: "#ff4444",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  secondary: {
    backgroundColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Alert specific styles
  alertOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '60%',
    height: '15%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  alertIcon: {
    marginBottom: 2,
  },
  alertMessage: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  alertButton: {
    backgroundColor: '#800080',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    //minWidth: 100,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});