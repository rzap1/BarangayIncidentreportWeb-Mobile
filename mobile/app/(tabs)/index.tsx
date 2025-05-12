import { Platform, StyleSheet } from 'react-native';
import Login from './Login'; // Import your Login component
import ParallaxScrollView from '@/components/ParallaxScrollView';
export default function HomeScreen() {
  return (
    <Login />
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
