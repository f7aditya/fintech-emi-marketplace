import { Redirect } from 'expo-router';

// The app opens on Home; the 1Fi Marketplace lives under the Shop tab.
export default function Index() {
  return <Redirect href="/home" />;
}
