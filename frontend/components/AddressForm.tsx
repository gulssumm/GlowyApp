import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ButtonStyles } from "@/styles/buttons";

export interface AddressFormData {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressFormProps {
  initialData?: AddressFormData;
  onSubmit: (data: AddressFormData) => void;
  submitting: boolean;
  onCancel?: () => void;
  inputStyle?: any;
  inputRowStyle?: any;
  halfInputStyle?: any;
  checkboxContainerStyle?: any;
  checkboxStyle?: any;
  checkboxTextStyle?: any;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  initialData,
  onSubmit,
  submitting,
  onCancel,
  inputStyle,
  inputRowStyle,
  halfInputStyle,
  checkboxContainerStyle,
  checkboxStyle,
  checkboxTextStyle,
}) => {
  const [formData, setFormData] = useState<AddressFormData>(
    initialData || {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      isDefault: false,
    }
  );

  const isFormValid = () =>
    formData.street.trim() !== "" &&
    formData.city.trim() !== "" &&
    formData.state.trim() !== "" &&
    formData.postalCode.trim() !== "" &&
    formData.country.trim() !== "";

  return (
    <View>
      <TextInput
        style={inputStyle}
        placeholder="Street Address"
        placeholderTextColor="#666"
        value={formData.street}
        onChangeText={(text) => setFormData({ ...formData, street: text })}
      />
      <View style={inputRowStyle}>
        <TextInput
          style={[inputStyle, halfInputStyle]}
          placeholder="City"
          placeholderTextColor="#666"
          value={formData.city}
          onChangeText={(text) => setFormData({ ...formData, city: text })}
        />
        <TextInput
          style={[inputStyle, halfInputStyle]}
          placeholder="State"
          placeholderTextColor="#666"
          value={formData.state}
          onChangeText={(text) => setFormData({ ...formData, state: text })}
        />
      </View>
      <View style={inputRowStyle}>
        <TextInput
          style={[inputStyle, halfInputStyle]}
          placeholder="Postal Code"
          placeholderTextColor="#666"
          value={formData.postalCode}
          onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
        />
        <TextInput
          style={[inputStyle, halfInputStyle]}
          placeholder="Country"
          placeholderTextColor="#666"
          value={formData.country}
          onChangeText={(text) => setFormData({ ...formData, country: text })}
        />
      </View>
      <TouchableOpacity
        style={checkboxContainerStyle}
        onPress={() =>
          setFormData({ ...formData, isDefault: !formData.isDefault })
        }
      >
        <View style={checkboxStyle}>
          {formData.isDefault && (
            <Ionicons name="checkmark" size={16} color="#800080" />
          )}
        </View>
        <Text style={checkboxTextStyle}>Set as default address</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
        {onCancel && (
          <TouchableOpacity
            style={[ButtonStyles.primary, { flex: 1 }]}
            onPress={onCancel}
            disabled={submitting}
          >
            <Text style={[ButtonStyles.text, { color: "#fff" }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            ButtonStyles.primary,
            { flex: 1 },
            (!isFormValid() || submitting) && ButtonStyles.disabled,
          ]}
          onPress={() => isFormValid() && onSubmit(formData)}
          disabled={!isFormValid() || submitting}
        >
          <Text
            style={[
              ButtonStyles.text,
              (!isFormValid() || submitting) && ButtonStyles.textDisabled,
            ]}
          >
            {submitting ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  halfInput: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#800080",
    borderRadius: 4,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxText: {
    fontSize: 16,
    color: "#333",
  },
});