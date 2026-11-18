import { Redirect } from 'expo-router';

import { routes } from '../src/navigation/routes';

/** Existing profile deep links resolve to the new Career destination. */
export default function Profile() {
  return <Redirect href={routes.career} />;
}
