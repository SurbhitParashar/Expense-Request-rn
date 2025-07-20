import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar,
    FlatList,
    Image,
    Alert,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const DailyExpenseReceipts = ({ navigation, route }) => {
    // Receive dateData and tripName from params
    const [expenses, setExpenses] = useState([]);
    // console.log(route.params)
    const {
        dateData = [],
        displayDate = '',
        tripName = '',
        tripCity = '',
        tripDuration = '',
        tripId
    } = route.params;

    useEffect(() => {
        // Initialize expenses from navigation params
        setExpenses(dateData);
    }, [dateData]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleReceiptPress = (expense) => {
        // Navigate or show modal with full expense details
        navigation.navigate('ReceiptDetail', { expense });
    };

    const handleEditExpense = (expense) => {
        // Navigate to edit screen
        navigation.navigate('AddExpense', {
            tripId,           // the parent trip
            expense           // the full expense object
        });
    };

    const handleDeleteExpense = (expense) => {
  Alert.alert(
    "Delete Receipt",
    "Are you sure you want to delete this receipt? \n(this will be permanentaly deleted)",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // 1) Remove from Firestore
            const pCard = await AsyncStorage.getItem('userPCard');
            if (!pCard) throw new Error('User ID not found');

            // Build the exact path: /expenses/{pCard}/expenses/{tripId}/details/{expense.id}
            const expenseDoc = doc(
              db,
              'expenses',
              pCard,
              'expenses',
              tripId,
              'details',
              expense.id
            );
            await deleteDoc(expenseDoc);

            // 2) Remove locally so UI updates immediately
            setExpenses(current => current.filter(item => item.id !== expense.id));
          } catch (err) {
            console.error('Delete Error:', err);
            Alert.alert('Error', 'Could not delete receipt. Please try again.');
          }
        }
      }
    ]
  );
};


    const getTotalExpenses = () => {
        return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
    };

    const renderReceiptCard = ({ item, index }) => (
        <TouchableOpacity
            style={[styles.receiptCard, { marginLeft: index === 0 ? 20 : 0 }]}
            onPress={() => handleReceiptPress(item)}
            activeOpacity={0.8}
        >
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditExpense(item)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="create-outline" size={16} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteExpense(item)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="trash-outline" size={16} color="#ff4444" />
                </TouchableOpacity>
            </View>

            {/* Receipt Image */}
            <View style={styles.receiptImageContainer}>
                {item.receiptPhoto ? (
                    <Image source={{ uri: item.receiptPhoto }} style={styles.receiptImage} />
                ) : (
                    <View style={styles.receiptImagePlaceholder}>
                        <Ionicons name="document-text-outline" size={28} color="#999" />
                        <Text style={styles.receiptImagePlaceholderText}>No Receipt</Text>
                    </View>
                )}
                <View style={styles.receiptOverlay}>
                    <TouchableOpacity
                        style={styles.editButtonOverlay}
                        onPress={() => handleEditExpense(item)}
                        activeOpacity={0.7}
                    >
                        {/* <Ionicons name="create-outline" size={18} color="#666" /> */}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButtonOverlay}
                        onPress={() => handleDeleteExpense(item)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ff4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Receipt Content */}
            <View style={styles.receiptContent}>
                <View style={styles.receiptHeader}>
                    <Text style={styles.receiptCategory}>{item.category}</Text>
                    <Text style={styles.receiptAmount}>${parseFloat(item.amount).toLocaleString()}</Text>
                </View>
                <Text style={styles.receiptSubCategory}>{item.subCategory}</Text>
                <View style={styles.receiptFooter}>
                    <View style={styles.paymentMethodBadge}>
                        <Ionicons
                            name={item.paymentMethod === 'college' ? 'card' : 'card-outline'}
                            size={12}
                            color="#666"
                        />
                        <Text style={styles.paymentMethodText}>
                            {item.paymentMethod === 'college' ? 'Corporate' : 'Personal'}
                        </Text>
                    </View>
                    <Text style={styles.receiptTime}>{formatTime(item.date || displayDate)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#d13a3d" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Daily Receipts</Text>
                    <Text style={styles.headerSubtitle}>{formatDate(displayDate)}</Text>
                </View>
                
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {/* Trip Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.summaryIcon}>
                            <Ionicons name="business" size={20} color="#d13a3d" />
                        </View>
                        <View style={styles.summaryInfo}>
                            <Text style={styles.summaryTitle}>{tripName}</Text>
                            <Text style={styles.summarySubtitle}>{tripCity}</Text>
                        </View>
                    </View>

                    <View style={styles.summaryStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total Expenses</Text>
                            <Text style={styles.statValue}>${getTotalExpenses().toLocaleString()}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Receipts</Text>
                            <Text style={styles.statValue}>{expenses.length}</Text>
                        </View>
                    </View>
                </View>

                {/* Receipts Section */}
                <View style={styles.receiptsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Expense Receipts</Text>
                    </View>

                    {expenses.length > 0 ? (
                        <FlatList
                            data={expenses}
                            renderItem={renderReceiptCard}
                            keyExtractor={(item) => item.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.receiptsList}
                            snapToInterval={width * 0.8}
                            decelerationRate="fast"
                            ItemSeparatorComponent={() => <View style={styles.receiptSeparator} />}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyStateText}>No receipts added yet</Text>
                            <TouchableOpacity style={styles.addReceiptButton}>
                                <Text style={styles.addReceiptButtonText}>Add Receipt</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d13a3d',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#d13a3d',
        paddingTop: 50,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitleContainer: {
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
        fontWeight: '500',
    },
    menuButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    content: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: 8,
    },
    scrollContainer: {
        paddingTop: 24,
        paddingBottom: 40,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    summaryInfo: {
        flex: 1,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    summarySubtitle: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    summaryStats: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 16,
    },
    receiptsSection: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: 0.3,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
        fontWeight: '500',
    },
    receiptsList: {
        paddingRight: 20,
    },
    receiptSeparator: {
        width: 12,
    },
    receiptCard: {
        width: width * 0.75,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        minHeight: 280,
        position: 'relative',
    },
    actionButtons: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        zIndex: 2,
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#ffe0e0',
    },
    receiptImageContainer: {
        height: 140,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        position: 'relative',
    },
    receiptImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    receiptImagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        borderRadius: 8,
    },
    receiptImagePlaceholderText: {
        fontSize: 11,
        color: '#999',
        marginTop: 6,
        fontWeight: '500',
    },
    receiptOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    receiptStatus: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    receiptContent: {
        flex: 1,
    },
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    receiptCategory: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        flex: 1,
        marginRight: 8,
    },
    receiptAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#d13a3d',
    },
    receiptSubCategory: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
        fontWeight: '500',
    },
    receiptFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentMethodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    paymentMethodText: {
        fontSize: 11,
        color: '#666',
        marginLeft: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    receiptTime: {
        fontSize: 11,
        color: '#999',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 20,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
        marginBottom: 24,
        fontWeight: '500',
    },
    addReceiptButton: {
        backgroundColor: '#d13a3d',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    addReceiptButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DailyExpenseReceipts;