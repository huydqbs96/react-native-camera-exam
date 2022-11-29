import axios, { AxiosRequestHeaders } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

let alertPresent = false;

export const checkInternetConnection = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected || false;
};

export const refreshToken = async (
  refresh_token: string,
  urlRefreshToken: string,
  clientId: string,
  clientSecret: string
) => {
  if (await checkInternetConnection()) {
    alertPresent = false;
    if (!refresh_token) {
      return false;
    }
    const body = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    };
    const headers: AxiosRequestHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    let responseJson = await axios({
      method: 'POST',
      url: urlRefreshToken,
      headers: headers,
      data: body,
    });

    if (responseJson.data.result) {
      return responseJson.data.result;
    } else {
      return null;
    }
  } else {
    if (!alertPresent) {
      alertPresent = true;
      Alert.alert(
        '',
        'サーバーへ接続出来ません。\nインターネット接続を確認してください。'
      );
    }
    return null;
  }
};

export const post = async (
  url: string,
  body: Object,
  isNoneAuth = true,
  isLogout: boolean,
  access_token: string,
  refresh_token: string,
  urlRefreshToken: string,
  clientId: string,
  clientSecret: string,
  logOutFunc: () => void
): Promise<any> => {
  if (await checkInternetConnection()) {
    alertPresent = false;
    let headers: AxiosRequestHeaders = isNoneAuth
      ? {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*',
          'Authorization': `Bearer ${access_token}`,
        }
      : {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*',
        };

    let responseJson = await axios({
      method: 'POST',
      url: url,
      headers: headers,
      data: body,
    });

    console.log(
      'response post => ',
      responseJson.data + '---' + responseJson.status
    );

    if (
      !responseJson.data.result &&
      (responseJson.data.message === 401 || responseJson.data.message === 403)
    ) {
      let refreshResult = await refreshToken(
        refresh_token,
        urlRefreshToken,
        clientId,
        clientSecret
      );
      if (refreshResult) {
        return post(
          url,
          body,
          isNoneAuth,
          isLogout,
          access_token,
          refresh_token,
          urlRefreshToken,
          clientId,
          clientSecret,
          logOutFunc
        );
      } else {
        Alert.alert(
          '',
          'アクセストークンの有効期限が切れました。\n再度ログインして下さい。',
          [
            {
              text: 'Ok',
              onPress: () => {
                logOutFunc();
              },
            },
          ]
        );
      }
    } else {
      return responseJson;
    }
  } else {
    if (!alertPresent) {
      alertPresent = true;
      Alert.alert(
        '',
        'サーバーへ接続出来ません。\nインターネット接続を確認してください。'
      );
    }
  }
};

export const get = async (
  url: string,
  isNoneAuth = true,
  access_token: string,
  refresh_token: string,
  urlRefreshToken: string,
  clientId: string,
  clientSecret: string,
  logOutFunc: () => void
): Promise<any> => {
  if (await checkInternetConnection()) {
    alertPresent = false;
    let headers: AxiosRequestHeaders = isNoneAuth
      ? {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        }
      : {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
    let responseJson = await axios({
      method: 'GET',
      url: url,
      headers: headers,
    });

    console.log(
      'response get => ',
      responseJson.data + '---' + responseJson.status
    );

    if (
      !responseJson.data.result &&
      (responseJson.data.message === 401 || responseJson.data.message === 403)
    ) {
      let refreshResult = await refreshToken(
        refresh_token,
        urlRefreshToken,
        clientId,
        clientSecret
      );
      if (refreshResult) {
        return get(
          url,
          isNoneAuth,
          refreshResult.access_token,
          refreshResult.refresh_token,
          urlRefreshToken,
          clientId,
          clientSecret,
          logOutFunc
        );
      } else {
        Alert.alert(
          '',
          'アクセストークンの有効期限が切れました。\n再度ログインして下さい。',
          [
            {
              text: 'Ok',
              onPress: () => {
                logOutFunc();
              },
            },
          ]
        );
      }
    } else {
      return responseJson;
    }
  } else {
    if (!alertPresent) {
      alertPresent = true;
      Alert.alert(
        '',
        'サーバーへ接続出来ません。\nインターネット接続を確認してください。'
      );
    }
  }
};

export const postForm = async (
  url: string,
  data: FormData,
  access_token: string,
  refresh_token: string,
  urlRefreshToken: string,
  clientId: string,
  clientSecret: string,
  isNoneAuth = true,
  logOutFunc: () => void
): Promise<any> => {
  if (await checkInternetConnection()) {
    alertPresent = false;

    let responseJson = await axios({
      method: 'POST',
      url: url,
      headers: isNoneAuth
        ? {
            'Content-Type': 'multipart/form-data',
            'Accept': '*/*',
            'Authorization': `Bearer ${access_token}`,
          }
        : {
            'Content-Type': 'multipart/form-data',
            'Accept': '*/*',
          },
      data: data,
    });

    console.log(
      'response postForm => ',
      responseJson.data + '---' + responseJson.status
    );

    if (
      !responseJson.data.result &&
      (responseJson.data.code === 401 || responseJson.data.message === 403)
    ) {
      let refreshResult = await refreshToken(
        refresh_token,
        urlRefreshToken,
        clientId,
        clientSecret
      );
      if (refreshResult) {
        return postForm(
          url,
          data,
          refreshResult.access_token,
          refreshResult.refresh_token,
          urlRefreshToken,
          clientId,
          clientSecret,
          isNoneAuth,
          logOutFunc
        );
      } else {
        Alert.alert(
          '',
          'アクセストークンの有効期限が切れました。\n再度ログインして下さい。',
          [
            {
              text: 'Ok',
              onPress: () => {
                logOutFunc();
              },
            },
          ]
        );
      }
    } else {
      return responseJson;
    }
  } else {
    if (!alertPresent) {
      alertPresent = true;
      Alert.alert(
        '',
        'サーバーへ接続出来ません。\nインターネット接続を確認してください。'
      );
    }
  }
};
