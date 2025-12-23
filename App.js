import { useState, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@supplement_records';
const ITEMS_KEY = '@supplement_items';

export default function App() {
  const [items, setItems] = useState([{ id: '1', name: '크레아틴', emoji: '💊' }]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [records, setRecords] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemEmoji, setNewItemEmoji] = useState('💊');

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 첫 번째 항목 자동 선택
  useEffect(() => {
    if (items.length > 0 && !selectedItem) {
      setSelectedItem(items[0]);
    }
  }, [items, selectedItem]);

  const loadData = async () => {
    try {
      const [savedRecords, savedItems] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ITEMS_KEY)
      ]);

      if (savedRecords !== null) {
        setRecords(JSON.parse(savedRecords));
      }

      if (savedItems !== null) {
        const parsedItems = JSON.parse(savedItems);
        setItems(parsedItems);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const saveRecords = async (newRecords) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    } catch (error) {
      console.error('기록 저장 실패:', error);
    }
  };

  const saveItems = async (newItems) => {
    try {
      await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error('항목 저장 실패:', error);
    }
  };

  const toggleTodayIntake = (itemId) => {
    const today = getTodayDate();
    const itemRecords = records[itemId] || [];
    const todayRecord = itemRecords.find(record => record.date === today);
    const newTakenStatus = !todayRecord?.taken;

    // 기존 기록에서 오늘 날짜 제거
    const filteredRecords = itemRecords.filter(record => record.date !== today);

    // 새로운 기록 추가
    const newItemRecords = [
      { date: today, taken: newTakenStatus, timestamp: new Date().toISOString() },
      ...filteredRecords
    ];

    const newRecords = {
      ...records,
      [itemId]: newItemRecords
    };

    setRecords(newRecords);
    saveRecords(newRecords);
  };

  const addNewItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('알림', '항목 이름을 입력해주세요.');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      emoji: newItemEmoji || '💊'
    };

    const newItems = [...items, newItem];
    setItems(newItems);
    saveItems(newItems);

    setModalVisible(false);
    setNewItemName('');
    setNewItemEmoji('💊');
  };

  const deleteItem = (itemId) => {
    if (items.length <= 1) {
      Alert.alert('알림', '최소 1개의 항목은 있어야 합니다.');
      return;
    }

    Alert.alert(
      '삭제 확인',
      '이 항목과 관련된 모든 기록이 삭제됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            const newItems = items.filter(item => item.id !== itemId);
            setItems(newItems);
            saveItems(newItems);

            const newRecords = { ...records };
            delete newRecords[itemId];
            setRecords(newRecords);
            saveRecords(newRecords);

            if (selectedItem?.id === itemId) {
              setSelectedItem(newItems[0]);
            }
          }
        }
      ]
    );
  };

  // 선택된 항목의 오늘 상태
  const todayTaken = useMemo(() => {
    if (!selectedItem) return false;
    const today = getTodayDate();
    const itemRecords = records[selectedItem.id] || [];
    const todayRecord = itemRecords.find(record => record.date === today);
    return todayRecord?.taken || false;
  }, [selectedItem, records]);

  // 달력에 표시할 마킹 데이터 생성
  const markedDates = useMemo(() => {
    if (!selectedItem) return {};

    const marked = {};
    const today = getTodayDate();
    const itemRecords = records[selectedItem.id] || [];

    itemRecords.forEach(record => {
      if (record.taken) {
        marked[record.date] = {
          marked: true,
          dotColor: '#4CAF50',
        };
      } else {
        marked[record.date] = {
          marked: true,
          dotColor: '#F44336',
        };
      }
    });

    // 오늘 날짜 강조
    if (!marked[today]) {
      marked[today] = {
        selected: true,
        selectedColor: '#E0E0E0',
      };
    } else {
      marked[today] = {
        ...marked[today],
        selected: true,
        selectedColor: marked[today].dotColor === '#4CAF50' ? '#E8F5E9' : '#FFEBEE',
      };
    }

    return marked;
  }, [selectedItem, records]);

  // 통계 계산
  const stats = useMemo(() => {
    if (!selectedItem) return { takenCount: 0, notTakenCount: 0, totalDays: 0, successRate: 0 };

    const itemRecords = records[selectedItem.id] || [];
    const takenCount = itemRecords.filter(r => r.taken).length;
    const notTakenCount = itemRecords.filter(r => !r.taken).length;
    const totalDays = itemRecords.length;
    const successRate = totalDays > 0 ? Math.round((takenCount / totalDays) * 100) : 0;

    return { takenCount, notTakenCount, totalDays, successRate };
  }, [selectedItem, records]);

  if (!selectedItem) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainContent}>
          <Text style={styles.title}>건강 체크</Text>

          {/* 항목 선택 탭 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContent}
          >
            {items.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.tab, selectedItem.id === item.id && styles.tabActive]}
                onPress={() => setSelectedItem(item)}
                onLongPress={() => deleteItem(item.id)}
              >
                <Text style={styles.tabEmoji}>{item.emoji}</Text>
                <Text style={[styles.tabText, selectedItem.id === item.id && styles.tabTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addTabButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addTabText}>+ 추가</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.todaySection}>
            <Text style={styles.todayText}>
              오늘 {selectedItem.name}을(를) 먹었나요?
            </Text>

            <TouchableOpacity
              style={[styles.button, todayTaken && styles.buttonTaken]}
              onPress={() => toggleTodayIntake(selectedItem.id)}
            >
              <Text style={styles.buttonText}>
                {todayTaken ? '✓ 먹었어요!' : '아직 안 먹었어요'}
              </Text>
            </TouchableOpacity>

            {todayTaken && (
              <Text style={styles.confirmText}>오늘 기록이 저장되었습니다!</Text>
            )}
          </View>

          {/* 통계 섹션 */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.takenCount}</Text>
              <Text style={styles.statLabel}>먹은 날</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.notTakenCount}</Text>
              <Text style={styles.statLabel}>안 먹은 날</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.successRate}%</Text>
              <Text style={styles.statLabel}>성공률</Text>
            </View>
          </View>

          {/* 달력 섹션 */}
          <View style={styles.calendarSection}>
            <Text style={styles.sectionTitle}>📅 달력</Text>
            <Calendar
              markedDates={markedDates}
              theme={{
                todayTextColor: '#2196F3',
                arrowColor: '#2196F3',
                monthTextColor: '#333',
                textMonthFontWeight: 'bold',
                textMonthFontSize: 18,
              }}
              markingType={'simple'}
            />

            {/* 범례 */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>먹은 날</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                <Text style={styles.legendText}>안 먹은 날</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 항목 추가 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 항목 추가</Text>

            <Text style={styles.inputLabel}>이모지</Text>
            <TextInput
              style={styles.input}
              value={newItemEmoji}
              onChangeText={setNewItemEmoji}
              placeholder="💊"
              maxLength={2}
            />

            <Text style={styles.inputLabel}>항목 이름</Text>
            <TextInput
              style={styles.input}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="예: 오메가3, 비타민D 등"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setNewItemName('');
                  setNewItemEmoji('💊');
                }}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={addNewItem}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 20,
    color: '#333',
  },
  tabsContainer: {
    marginBottom: 20,
  },
  tabsContent: {
    paddingRight: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  tabEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  addTabButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  todaySection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  button: {
    backgroundColor: '#ddd',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonTaken: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  confirmText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#4CAF50',
    fontSize: 14,
  },
  statsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  calendarSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#E0E0E0',
  },
  modalButtonConfirm: {
    backgroundColor: '#2196F3',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  modalButtonTextConfirm: {
    color: '#fff',
  },
});
