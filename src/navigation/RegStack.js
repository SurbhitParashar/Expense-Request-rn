// RegStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegistrationForm from '../screens/RegistrationForm';

const RegStack = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="RegistrationForm"
        component={RegistrationForm}
      />
    </Stack.Navigator>
  );
};
export default RegStack;
