import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { DocumentUpload } from '../../types/api';

interface DocumentCardProps {
  item: DocumentUpload;
  onDelete: (id: number) => void;
}

export const getStatusIcon = (status: string) => {
  if (status === 'VERIFIED') return 'checkmark-circle';
  if (status === 'REJECTED') return 'close-circle';
  // SUSPICIOUS and PENDING show the same neutral icon
  return 'time';
};

export const getStatusColors = (status: string) => {
  if (status === 'VERIFIED') return { bg: '#a0f399', text: '#005312', icon: '#217128', border: '#1b6d24' };
  if (status === 'REJECTED') return { bg: '#ffdad6', text: '#410002', icon: '#ba1a1a', border: '#93000a' };
  // SUSPICIOUS and PENDING show neutral colors
  return { bg: '#e0e2ec', text: '#44474f', icon: '#74777f', border: '#74777f' };
};

export const getDisplayStatus = (status: string) => {
  if (status === 'VERIFIED') return 'Verified';
  if (status === 'REJECTED') return 'Rejected';
  return 'Pending Review';
};

export function DocumentCard({ item, onDelete }: DocumentCardProps) {
  const statusColors = getStatusColors(item.verification_status);

  return (
    <View style={styles.docCard}>
      <View style={styles.docCardHeader}>
        <View style={styles.docInfo}>
          <View style={[styles.docIconBg, { backgroundColor: statusColors.bg }]}>
            <Ionicons name={getStatusIcon(item.verification_status)} size={16} color={statusColors.icon} />
          </View>
          <View style={styles.docTextInfo}>
            <Text style={styles.docFilename} numberOfLines={1}>{item.filename}</Text>
            <Text style={styles.docType}>{item.document_type}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <Pressable onPress={() => onDelete(item.id)} hitSlop={10} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Ionicons name={getStatusIcon(item.verification_status)} size={12} color={statusColors.text} />
            <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
              {getDisplayStatus(item.verification_status)}
            </Text>
          </View>
        </View>
      </View>
      {item.verification_notes ? (
        <View style={styles.notesContainer}>
          <Ionicons name="information-circle" size={14} color={colors.muted} />
          <Text style={styles.notesText}>{item.verification_notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  docCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  docIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  docTextInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  docFilename: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: colors.ink,
    marginBottom: 2,
  },
  docType: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 10,
    textTransform: 'capitalize',
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  notesText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: colors.ink,
    lineHeight: 18,
  }
});
