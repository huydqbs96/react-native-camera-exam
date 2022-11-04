import React, { useEffect } from 'react';

import { StyleSheet, View  } from 'react-native';
import { CameraView } from 'react-native-camera-exam';

export default function App() {

  useEffect(() => {

  }, []);

  return (
    <View style={styles.container}>
      <CameraView 
        urlSystem={'https://bks.beetsoft.com.vn/api/v1/uploadTrackingImage'}
        urlLogErr={'https://bks.beetsoft.com.vn/api/v1/exams/log'}
        userId={'useId'}
        examId={"exam123"}
        width={100}
        height={80}
        quality={0.1}
        style={styles.cameraView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraView: {
    marginTop: 30
  }
});
