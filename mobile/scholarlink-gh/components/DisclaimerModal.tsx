import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { AppButton } from './AppButton';
import { SectionHeader } from './SectionHeader';

interface DisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
  isAccepting: boolean;
  onClose: () => void;
}

export function DisclaimerModal({ visible, onAccept, isAccepting, onClose }: DisclaimerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} disabled={isAccepting} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>
          
          <SectionHeader 
            title="Document Disclaimer" 
            subtitle="By uploading documents, you agree that AI verification will be used to confirm document authenticity." 
          />
          
          <View style={styles.buttonContainer}>
            <AppButton 
              title={isAccepting ? "Accepting..." : "I understand and agree"} 
              onPress={onAccept} 
              disabled={isAccepting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 24,
  },
});
