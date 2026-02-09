import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getDeviceInfo = () => ({
    platform: Platform.OS,
    osVersion: Platform.Version ? Platform.Version.toString() : 'Unknown',
    appVersion: Constants.expoConfig?.version || '1.0.0',
    deviceModel: Constants.deviceName || 'Unknown'
});
