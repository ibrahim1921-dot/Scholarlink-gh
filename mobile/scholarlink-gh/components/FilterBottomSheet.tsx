import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  /** Display labels corresponding to each option. Falls back to option value if not provided. */
  labels?: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function FilterBottomSheet({
  visible,
  onClose,
  title,
  options,
  labels,
  selected,
  onSelect,
}: FilterBottomSheetProps) {
  const insets = useSafeAreaInsets();

  const handleSelect = (value: string | null) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Clear filter option */}
          <Pressable
            style={[styles.optionRow, selected === null && styles.optionRowActive]}
            onPress={() => handleSelect(null)}
          >
            <Text
              style={[
                styles.optionText,
                selected === null && styles.optionTextActive,
              ]}
            >
              All (no filter)
            </Text>
            {selected === null && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </Pressable>

          <View style={styles.divider} />

          {/* Options list */}
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const isSelected = selected === item;
              const label = labels?.[index] ?? item;
              return (
                <Pressable
                  style={[styles.optionRow, isSelected && styles.optionRowActive]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  list: {
    flexGrow: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  optionRowActive: {
    backgroundColor: 'rgba(0, 51, 102, 0.06)',
  },
  optionText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 15,
    color: colors.ink,
    flex: 1,
  },
  optionTextActive: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: colors.primary,
  },
});
