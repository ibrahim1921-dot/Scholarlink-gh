import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

export type ActiveFilter =
  | { type: 'saved' }
  | { type: 'matches' }
  | { type: 'country'; value: string }
  | { type: 'field'; value: string }
  | { type: 'status'; value: string }
  | null;

const STATUS_OPTIONS = ['OPEN', 'CLOSING_SOON', 'CLOSED', 'FULL'];
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  CLOSING_SOON: 'Closing Soon',
  CLOSED: 'Closed',
  FULL: 'Full',
};

interface FiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  activeFilter: ActiveFilter;
  onApplyFilter: (filter: ActiveFilter) => void;
  countries: string[];
  fields: string[];
}

export function FiltersSheet({
  visible,
  onClose,
  activeFilter,
  onApplyFilter,
  countries,
  fields,
}: FiltersSheetProps) {
  const insets = useSafeAreaInsets();

  const handleSelect = (filter: ActiveFilter) => {
    onApplyFilter(filter);
    onClose();
  };

  const isActive = (type: string, value?: string) => {
    if (!activeFilter) return false;
    if (activeFilter.type !== type) return false;
    if (value && 'value' in activeFilter) return activeFilter.value === value;
    return type === 'saved';
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
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <View style={styles.headerActions}>
              {activeFilter && (
                <TouchableOpacity
                  onPress={() => handleSelect(null)}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.ink} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Saved Section */}
            <Text style={styles.sectionHeader}>Bookmarks</Text>
            <Pressable
              style={[styles.optionRow, isActive('saved') && styles.optionRowActive]}
              onPress={() =>
                handleSelect(isActive('saved') ? null : { type: 'saved' })
              }
            >
              <View style={styles.optionContent}>
                <Ionicons
                  name={isActive('saved') ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={isActive('saved') ? colors.primary : colors.muted}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.optionText,
                    isActive('saved') && styles.optionTextActive,
                  ]}
                >
                  Saved Scholarships
                </Text>
              </View>
              {isActive('saved') && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </Pressable>

            <Pressable
              style={[styles.optionRow, isActive('matches') && styles.optionRowActive]}
              onPress={() =>
                handleSelect(isActive('matches') ? null : { type: 'matches' })
              }
            >
              <View style={styles.optionContent}>
                <Ionicons
                  name={isActive('matches') ? 'sparkles' : 'sparkles-outline'}
                  size={18}
                  color={isActive('matches') ? colors.primary : colors.muted}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.optionText,
                    isActive('matches') && styles.optionTextActive,
                  ]}
                >
                  AI Matches
                </Text>
              </View>
              {isActive('matches') && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </Pressable>

            {/* Status Section */}
            <Text style={styles.sectionHeader}>Status</Text>
            {STATUS_OPTIONS.map((status) => (
              <Pressable
                key={status}
                style={[
                  styles.optionRow,
                  isActive('status', status) && styles.optionRowActive,
                ]}
                onPress={() =>
                  handleSelect(
                    isActive('status', status)
                      ? null
                      : { type: 'status', value: status }
                  )
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    isActive('status', status) && styles.optionTextActive,
                  ]}
                >
                  {STATUS_LABELS[status]}
                </Text>
                {isActive('status', status) && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </Pressable>
            ))}

            {/* Country Section */}
            <Text style={styles.sectionHeader}>Country</Text>
            {countries.length === 0 ? (
              <Text style={styles.emptyText}>No countries available</Text>
            ) : (
              countries.map((country) => (
                <Pressable
                  key={country}
                  style={[
                    styles.optionRow,
                    isActive('country', country) && styles.optionRowActive,
                  ]}
                  onPress={() =>
                    handleSelect(
                      isActive('country', country)
                        ? null
                        : { type: 'country', value: country }
                    )
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      isActive('country', country) && styles.optionTextActive,
                    ]}
                  >
                    {country}
                  </Text>
                  {isActive('country', country) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))
            )}

            {/* Field Section */}
            <Text style={styles.sectionHeader}>Field of Study</Text>
            {fields.length === 0 ? (
              <Text style={styles.emptyText}>No fields available</Text>
            ) : (
              fields.map((field) => (
                <Pressable
                  key={field}
                  style={[
                    styles.optionRow,
                    isActive('field', field) && styles.optionRowActive,
                  ]}
                  onPress={() =>
                    handleSelect(
                      isActive('field', field)
                        ? null
                        : { type: 'field', value: field }
                    )
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      isActive('field', field) && styles.optionTextActive,
                    ]}
                  >
                    {field}
                  </Text>
                  {isActive('field', field) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))
            )}

            {/* Bottom spacer */}
            <View style={{ height: 16 }} />
          </ScrollView>
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
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 8,
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
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: colors.ink,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
  },
  clearBtnText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 13,
    color: colors.danger,
  },
  scrollView: {
    flexGrow: 0,
  },
  sectionHeader: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionRowActive: {
    backgroundColor: 'rgba(0, 51, 102, 0.06)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 15,
    color: colors.ink,
  },
  optionTextActive: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    color: colors.primary,
  },
  emptyText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontStyle: 'italic',
  },
});
