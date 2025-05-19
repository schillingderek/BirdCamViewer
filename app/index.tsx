import React, { useState } from "react";
import { View, Text, Button, Modal, TouchableOpacity, StyleSheet } from "react-native";
import MediaGrid from "../components/MediaGrid";
import { Stack } from "expo-router";
import { Picker } from "@react-native-picker/picker";

export default function Page() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Bird Cam Media",
          headerRight: () => (
            <Button title="Reload" onPress={() => setRefreshKey((prev) => prev + 1)} />
          ),
        }}
      />

      <View style={styles.container}>
        {/* Filter Button */}
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>
            {selectedSpecies ? `Filter: ${selectedSpecies}` : "Select Bird Species"}
          </Text>
        </TouchableOpacity>

        {/* Content Container */}
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* Images Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Images</Text>
            <View style={styles.mediaContainer}>
              <MediaGrid key={`images-${refreshKey}`} folder="images" filterSpecies={selectedSpecies} />
            </View>
          </View>

          {/* Videos Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Videos</Text>
            <View style={styles.mediaContainer}>
              <MediaGrid key={`videos-${refreshKey}`} folder="videos" filterSpecies={selectedSpecies} />
            </View>
          </View>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Bird Species</Text>
            <Picker
              selectedValue={selectedSpecies}
              onValueChange={(itemValue) => setSelectedSpecies(itemValue)}
              style={styles.picker}
              itemStyle={{ color: "black" }} 
            >
              <Picker.Item label="All Species" value="" />
              <Picker.Item label="American Goldfinch" value="americangoldfinch" />
              <Picker.Item label="American Robin" value="americanrobin" />
              <Picker.Item label="Barn Swallow" value="barnswallow" />
              <Picker.Item label="Black-capped Chickadee" value="black-cappedchickadee" />
              <Picker.Item label="Blue Jay" value="bluejay" />
              <Picker.Item label="Cedar Waxwing" value="cedarwaxwing" />
              <Picker.Item label="Common Starling" value="commonstarling" />
              <Picker.Item label="Downy Woodpecker" value="downywoodpecker" />
              <Picker.Item label="House Finch" value="housefinch" />
              <Picker.Item label="House Sparrow" value="housesparrow" />
              <Picker.Item label="Mourning Dove" value="mourningdove" />
              <Picker.Item label="Northern Cardinal" value="northerncardinal" />
              <Picker.Item label="Red-headed Woodpecker" value="redheadedwoodpecker" />
              <Picker.Item label="Red-winged Blackbird" value="redwingedblackbird" />
            </Picker>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  filterButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  filterButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionContainer: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    textAlign: "center",
    marginVertical: 10,
  },
  mediaContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  picker: {
    width: "100%",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
