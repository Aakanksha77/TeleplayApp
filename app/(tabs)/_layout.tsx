import { Tabs } from 'expo-router';
import { Search, Video, CreditCard, Menu } from 'lucide-react-native';
import { Text, TouchableOpacity, Animated } from 'react-native';
import { useRef, useEffect } from 'react';

function CustomTabBarButton({
  accessibilityState,
  children,
  onPress,
  label,
}: {
  accessibilityState?: { selected?: boolean }, // <- make it optional
  children: (color: string) => React.ReactNode,
  onPress: () => void,
  label: string
}) {
  const focused = accessibilityState?.selected ?? false; // ✅ safe access

  // animate flex instead of width
  const flexAnim = useRef(new Animated.Value(focused ? 2 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(flexAnim, {
      toValue: focused ? 2 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();

    Animated.timing(opacityAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ flex: flexAnim, marginHorizontal: 2 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ flex: 1 }}>
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: focused ? '#0088cc' : 'transparent',
            borderRadius: 10,
            paddingHorizontal: 10,
            height: 50,
          }}
        >
          {children(focused ? '#fff' : '#0088cc')}

          {focused && (
            <Animated.Text
              style={{
                color: '#fff',
                marginLeft: 6,
                fontWeight: '600',
                opacity: opacityAnim,
              }}
            >
              {label}
            </Animated.Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}



export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} label="Search">
              {(color) => <Search size={22} color={color} />}
            </CustomTabBarButton>
          ),
        }}
      />
      <Tabs.Screen
        name="video"
        options={{
          title: 'Video',
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} label="History">
              {(color) => <Video size={22} color={color} />}
            </CustomTabBarButton>
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Subscriptions',
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} label="Subscriptions">
              {(color) => <CreditCard size={22} color={color} />}
            </CustomTabBarButton>
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} label="Menu">
              {(color) => <Menu size={22} color={color} />}
            </CustomTabBarButton>
          ),
        }}
      />
    </Tabs>
  );
}
