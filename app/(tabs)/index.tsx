import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function App() {
  const [turkishWord, setTurkishWord] = useState('');
  const [spanishWord, setSpanishWord] = useState('');

  // Function to translate Turkish -> Spanish
  const translateToSpanish = async (text: string) => {
    setTurkishWord(text); // update Turkish box
    if (text.trim() === '') {
      setSpanishWord('');
      return;
    }

    try {
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: 'tr',
          target: 'es',
          format: 'text',
        }),
      });

      const data = await response.json();
      setSpanishWord(data.translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      setSpanishWord('Error');
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Glowy App</Text>

      <View style={styles.boxContainer}>
        {/* Turkish Box */}
        <View style={styles.box}>
          <Text style={styles.title}>Turkish</Text>
          <TextInput
            style={styles.wordInput}
            value={turkishWord}
            onChangeText={setTurkishWord}
            placeholder="Type here"
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Spanish Box */}
        <View style={styles.box}>
          <Text style={styles.title}>Spanish</Text>
          <TextInput
            style={styles.wordInput}
            value={spanishWord}
            editable={false}
            placeholder=""
            placeholderTextColor="#aaa"

          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: 40,
  },
  boxContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#ffffff',
    padding: 30,
    marginVertical: 15,           // space between boxes
    borderRadius: 20,             // more rounded corners
    width: 280,                   // bigger width
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,                 // android shadow
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wordInput: {
    fontSize: 24,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
    textAlign: 'center',
  },
});
