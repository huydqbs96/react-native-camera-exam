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

    console.log('refreshResult', responseJson);

    if (responseJson.status == 200) {
      return responseJson.data;
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
    try {
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
        'responseJson => ',
        responseJson.status + '===' + responseJson?.data
      );
      return responseJson;
    } catch (error: any) {
      console.log('error post => ', error?.response);
      if (
        error?.response?.status === 401 &&
        error?.response?.data?.message !=
          'あなたのアカウントは他の端末でログインされました'
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
      } else if (
        error?.response?.status === 401 &&
        error?.response?.data?.message ==
          'あなたのアカウントは他の端末でログインされました'
      ) {
        Alert.alert('', 'あなたのアカウントは他の端末でログインされました', [
          {
            text: 'Ok',
            onPress: () => {
              logOutFunc();
            },
          },
        ]);
      }
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
    try {
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
        'responseJson => ',
        responseJson.status + '===' + responseJson?.data
      );

      return responseJson;
    } catch (error: any) {
      console.log('error get => ', error?.response);
      if (
        error?.response?.status === 401 &&
        error?.response?.data?.message !=
          'あなたのアカウントは他の端末でログインされました'
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
      } else if (
        error?.response?.status === 401 &&
        error?.response?.data?.message ==
          'あなたのアカウントは他の端末でログインされました'
      ) {
        Alert.alert('', 'あなたのアカウントは他の端末でログインされました', [
          {
            text: 'Ok',
            onPress: () => {
              logOutFunc();
            },
          },
        ]);
      }
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
  isPublic = false,
  logOutFunc: () => void
): Promise<any> => {
  if (await checkInternetConnection()) {
    try {
      alertPresent = false;

      let responseJson = await axios({
        method: 'POST',
        url: url,
        headers:
          isNoneAuth && !isPublic
            ? {
                'Content-Type': 'multipart/form-data',
                'Accept': '*/*',
                'Authorization': `Bearer ${access_token}`,
              }
            : isNoneAuth && isPublic
            ? {
                'Content-Type': 'multipart/form-data',
                'Accept': '*/*',
                'Authorization': `Bearer ${access_token}`,
                'x-amz-acl': 'public-read',
              }
            : {
                'Content-Type': 'multipart/form-data',
                'Accept': '*/*',
              },
        data: data,
      });

      console.log(
        'responseJson => ',
        responseJson.status + '===' + responseJson?.data
      );
      return responseJson;
    } catch (error: any) {
      console.log('error post form= >', error.response);
      if (
        error?.response?.status === 401 &&
        error?.response?.data?.message !=
          'あなたのアカウントは他の端末でログインされました'
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
            isPublic,
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
      } else if (
        error?.response?.status === 401 &&
        error?.response?.data?.message ==
          'あなたのアカウントは他の端末でログインされました'
      ) {
        Alert.alert('', 'あなたのアカウントは他の端末でログインされました', [
          {
            text: 'Ok',
            onPress: () => {
              logOutFunc();
            },
          },
        ]);
      }
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
