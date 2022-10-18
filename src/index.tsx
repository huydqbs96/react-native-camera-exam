import React, { useRef, useEffect, useState } from 'react';

import { StyleSheet, Text } from 'react-native';
import { useCameraDevices, Camera } from 'react-native-vision-camera';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import axios from 'axios';

type CameraType = {
  width?: number
  height?: number
  frameWidth?: number
  framHeight?: number
  quality?: 'quality' | 'balanced' | 'speed'
}

export function CameraView(propCamera: CameraType) {

  const { width, height } = propCamera

  const devices = useCameraDevices();
  const camera = useRef<Camera>(null)
  const device = devices.front

  const [uriImage, setUriImage] = useState<string>('');

  useEffect(() => {
    setTimeout(() => {
      takePhotoAuto()
    }, 3000);
  });

  useEffect(() => {
    if (uriImage) {
      console.log('uri => ', uriImage);

      ImageResizer.createResizedImage(
        uriImage,
        720,
        720,
        'PNG',
        0.15, 0,
        undefined, false
      )
        .then((response) => {
          // response.uri is the URI of the new image that can now be displayed, uploaded...
          // response.path is the path of the new image
          // response.name is the name of the new image with the extension
          // response.size is the size of the new image
          console.log('response => ', response);
          pushImage(response.uri, response.name);
        })
        .catch((err) => {
          // Oops, something went wrong. Check that the filename is correct and
          // inspect err to get more details.
          console.log('error resize => ', err);

        });
    }
  }, [uriImage]);

  const pushImage = async (uriImage: string, nameFile: string) => {
    var formData = new FormData();
    formData.append("examKey", "beetsoft031");
    formData.append("userId", "2");
    formData.append("image", {
      uri: uriImage,
      type: "image/png",
      name: nameFile,
    });
    try {
      let response = await axios({
        method: "POST",
        url: "https://bks.beetsoft.com.vn/api/v1/uploadTrackingImage",
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json",
        },
        data: formData,
      });
      console.log('reponse api => ', response.data);

    } catch (e) {
      console.log('error => ', e);
    }
  }

  const takePhotoAuto = async () => {
    const photo = await camera.current?.takePhoto({
      flash: 'off'
    })
    console.log('data image => ', photo?.path);
    setUriImage("file:/" + photo?.path)
  }
  if (device == null) return <><Text>null camera</Text></>;

  return (
    <Camera
      photo={true}
      ref={camera}
      style={[
        styles.cameraView,
        {
          width: width || 60,
          height: height || 60
        }
      ]}
      device={device}
      isActive={true}
    />
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  cameraView: {
    width: 100,
    height: 100
  }
});
