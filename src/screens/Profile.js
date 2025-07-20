import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    StatusBar,
    SafeAreaView,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDataContext } from '../context/TripData';


const ProfilePage = () => {
    const { signOut } = useContext(AppDataContext);

    const [userData, setUserData] = useState({
        name: '',
        department: '',
        employeeId: '',
    });

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const name = await AsyncStorage.getItem('userName');
                const department = await AsyncStorage.getItem('department');
                const employeeId = await AsyncStorage.getItem('userPCard'); // pCard saved as ID

                setUserData({
                    name: name || 'N/A',
                    department: department || 'N/A',
                    employeeId: employeeId || 'N/A',
                });
            } catch (error) {
                console.error('Error loading user data from AsyncStorage:', error);
            }
        };

        loadUserData();
    }, []);



    const handleEditProfile = () => {
        console.log('Edit profile pressed');
    };

    const handleSettings = () => {
        console.log('Settings pressed');
    };

    const handleSupport = () => {
        console.log('Support pressed');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#d13a3d" />
            <SafeAreaView
                   style={[
                     styles.container,
                     { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }
                   ]}
                 >
                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    {/* Header Section */}
                    <View style={styles.header}>
                        
                        <View style={styles.headerContent}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar}>
                                    <Feather name="user" size={40} color="white" />
                                </View>
                                <TouchableOpacity style={styles.editAvatarButton}>
                                    <Feather name="camera" size={16} color="#d13a3d" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{userData.name}</Text>
                                <Text style={styles.userDepartment}>{userData.department}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats Cards */}


                    {/* User Details Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Feather name="info" size={20} color="#d13a3d" />
                            <Text style={styles.cardTitle}>Employee Information</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{`Employee ID \n(PCard)`}</Text>
                                <Text style={styles.detailValue}>{userData.employeeId}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Department</Text>
                                <Text style={styles.detailValue}>{userData.department}</Text>
                            </View>
                        </View>
                    </View>

                    {/* About Section */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Feather name="user" size={20} color="#d13a3d" />
                            <Text style={styles.cardTitle}>About</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.aboutText}>
                                Experienced finance professional with expertise in expense management and budget planning.
                                Committed to maintaining accurate financial records and ensuring compliance with company policies.
                            </Text>
                        </View>
                    </View>

                    {/* Menu Options */}
                    <View style={styles.menuContainer}>
                        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
                            <View style={styles.menuIconContainer}>
                                <Feather name="edit-3" size={20} color="#d13a3d" />
                            </View>
                            <Text style={styles.menuText}>Edit Profile</Text>
                            <Feather name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
                            <View style={styles.menuIconContainer}>
                                <Feather name="settings" size={20} color="#d13a3d" />
                            </View>
                            <Text style={styles.menuText}>Settings</Text>
                            <Feather name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
                            <View style={styles.menuIconContainer}>
                                <Feather name="help-circle" size={20} color="#d13a3d" />
                            </View>
                            <Text style={styles.menuText}>Help & Support</Text>
                            <Feather name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>

                    {/* Sign Out Button */}
                    <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                        <Feather name="log-out" size={20} color="white" />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomPadding} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d13a3d',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#d13a3d',
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#d13a3d',
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: 'white',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userInfo: {
        marginLeft: 20,
        flex: 1,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 2,
    },
    userDepartment: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: -20,
        marginBottom: 20,
        gap: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginLeft: 10,
    },
    cardContent: {
        padding: 20,
        paddingTop: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: 16,
        color: '#666',
        flex:1
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        flexShrink:1,
        flexWrap: 'wrap',
        textAlign:'right'
    },
    aboutText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#666',
    },
    menuContainer: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    signOutButton: {
        backgroundColor: '#d13a3d',
        marginHorizontal: 20,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    signOutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    bottomPadding: {
        height: 30,
    },
});

export default ProfilePage;