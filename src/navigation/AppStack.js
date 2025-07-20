// AppStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/Home';
import AddExpense from '../screens/AddExpense';
import AddTripDetails from '../screens/AddTripDetails';
import ExpenseDateOverview from '../screens/ExpenseDateOverview';
import DailyExpenseReceipts from '../screens/DailyExpenseReceipts';
import ProfilePage from '../screens/Profile';

const AppStack = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="AddExpense" component={AddExpense} />
      <Stack.Screen name="AddTripDetails" component={AddTripDetails} />
      <Stack.Screen
        name="ExpenseDateOverview"
        component={ExpenseDateOverview}
      />
      <Stack.Screen
        name="DailyExpenseReceipts"
        component={DailyExpenseReceipts}
      />
      <Stack.Screen name="Profile" component={ProfilePage} />
    </Stack.Navigator>
  );
};
export default AppStack;
