import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ButtonStyles } from "../styles/buttons";
import { headerStyles, commonColors, commonSpacing } from "../styles/commonStyles";

// Custom Alert Component 
export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose: () => void;
  icon?: string;
}
export const CustomAlert: React.FC<CustomAlertProps> = ({ visible, title, message, buttons, onClose, icon }) => {
  if (!visible) return null;

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'destructive':
        return ButtonStyles.warning;
      case 'cancel':
        return ButtonStyles.secondary;
      default:
        return ButtonStyles.primary;
    }
  };

  const getButtonTextStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return { ...ButtonStyles.text, color: '#333' };
      default:
        return ButtonStyles.text;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ButtonStyles.alertOverlay}>
        <View style={ButtonStyles.alertBox}>
          {icon && (
            <Ionicons
              name={icon as any}
              size={50}
              color={commonColors.primary}
              style={ButtonStyles.alertIcon}
            />
          )}
          <Text style={[ButtonStyles.alertMessage, { fontWeight: 'bold', fontSize: 18, marginBottom: 10 }]}>
            {title}
          </Text>
          <Text style={ButtonStyles.alertMessage}>
            {message}
          </Text>

          {buttons.length === 1 ? (
            <TouchableOpacity
              style={ButtonStyles.alertButton}
              onPress={() => {
                buttons[0].onPress();
                onClose();
              }}
            >
              <Text style={ButtonStyles.alertButtonText}>{buttons[0].text}</Text>
            </TouchableOpacity>
          ) : (
            <View style={ButtonStyles.alertButtonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    getButtonStyle(button.style),
                    {
                      flex: 1,
                      marginHorizontal: 8,
                      marginTop: 1,
                    }
                  ]}
                  onPress={() => {
                    button.onPress();
                    onClose();
                  }}
                >
                  <Text style={getButtonTextStyle(button.style)}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};