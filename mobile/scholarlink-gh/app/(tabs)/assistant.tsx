import { useState, useRef, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert, StyleSheet, Text, View, TextInput, ScrollView, Pressable, Platform, KeyboardAvoidingView, ActivityIndicator, Image, ImageBackground, Modal, TouchableOpacity, FlatList, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../constants/colors";
import { aiService } from "../../services/aiService";
import { documentService } from "../../services/documentService";
import { scholarshipService } from "../../services/scholarshipService";
import { useAuth } from "../../hooks/useAuth";
import { UserAvatar } from "../../components/UserAvatar";
import { DocumentUpload, Scholarship } from "../../types/api";

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  action?: 'review_mode' | null;
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello ${user?.username?.split(' ')[0] || 'there'}! I'm your scholarship coach. I can help you find Ghanaian scholarship opportunities or review your application essays. How can I help you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [attachedDocument, setAttachedDocument] = useState<DocumentUpload | null>(null);

  const [docPickerVisible, setDocPickerVisible] = useState(false);
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [scholarshipPickerVisible, setScholarshipPickerVisible] = useState(false);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loadingScholarships, setLoadingScholarships] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    );
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const addMessage = (text: string, sender: 'ai' | 'user', action?: 'review_mode' | null) => {
    let finalText = text;
    if (sender === 'ai') {
      finalText = text
        .replace(/\*\*/g, '')
        .replace(/__/g, '')
        .replace(/^\s*#+\s+/gm, '')
        .replace(/^\s*[-*]\s+/gm, '• ');
    }
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(),
      sender,
      text: finalText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const formatEssayReview = (result: any): string => {
    if (typeof result === 'string') return result;
    let formatted = '';
    if (result.quality_score !== undefined) {
      formatted += `Score: ${result.quality_score}/10\n\n`;
    }
    if (result.specific_suggestions && result.specific_suggestions.length > 0) {
      formatted += `💡 Suggestions:\n`;
      result.specific_suggestions.forEach((s: string) => formatted += `• ${s}\n`);
      formatted += '\n';
    }
    if (result.grammar_issues && result.grammar_issues.length > 0) {
      formatted += `✏️ Grammar & Mechanics:\n`;
      result.grammar_issues.forEach((g: string) => formatted += `• ${g}\n`);
    }
    return formatted.trim() || JSON.stringify(result, null, 2);
  };

  const formatEligibility = (scholarshipName: string, result: any): string => {
    if (typeof result === 'string') return result;

    const meets = result.overallMeets ?? result.meets ?? false;
    let formatted = `Based on your profile, you are ${meets ? 'eligible' : 'currently not eligible'} for ${scholarshipName}.\n\n`;

    if (result.criteria && Array.isArray(result.criteria)) {
      const met = result.criteria.filter((c: any) => c.met);
      const missing = result.criteria.filter((c: any) => !c.met);

      if (met.length > 0) {
        formatted += `✅ Requirements Met:\n`;
        met.forEach((c: any) => formatted += `• ${c.label || c.id}: ${c.reason}\n`);
        formatted += '\n';
      }
      if (missing.length > 0) {
        formatted += `❌ Missing Criteria:\n`;
        missing.forEach((c: any) => formatted += `• ${c.label || c.id}: ${c.reason}\n`);
        formatted += '\n';
      }
    } else {
      if (result.criteria_met && result.criteria_met.length > 0) {
        formatted += `✅ Requirements Met:\n`;
        result.criteria_met.forEach((c: string) => formatted += `• ${c}\n`);
        formatted += '\n';
      }
      if (result.criteria_missing && result.criteria_missing.length > 0) {
        formatted += `❌ Missing Criteria:\n`;
        result.criteria_missing.forEach((c: string) => formatted += `• ${c}\n`);
        formatted += '\n';
      }
      if (result.actions_required && result.actions_required.length > 0) {
        formatted += `📝 Next Steps:\n`;
        result.actions_required.forEach((c: string) => formatted += `• ${c}\n`);
      }
    }
    return formatted.trim() || JSON.stringify(result, null, 2);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    addMessage(userText, 'user');
    setInputText("");
    setLoading(true);

    try {
      if (reviewMode) {
        setReviewMode(false);
        const result = await aiService.reviewEssay(userText);
        const replyText = formatEssayReview(result);
        addMessage(`Here is my review:\n\n${replyText}`, 'ai');
      } else {
        const result = await aiService.askAssistant(userText, attachedDocument?.id);
        addMessage(result, 'ai');
      }
    } catch (e: any) {
      addMessage(`Error: ${e?.message ?? "Something went wrong."}`, 'ai');
    } finally {
      setLoading(false);
      setAttachedDocument(null);
    }
  };

  const handleGeneratePs = async () => {
    addMessage("Generate a personal statement for me.", 'user');
    setLoading(true);
    try {
      const ps = await aiService.generatePersonalStatement();
      addMessage(`Here is a drafted personal statement:\n\n${ps}`, 'ai');
    } catch (e: any) {
      addMessage(`Failed to generate: ${e?.message ?? "Unknown error."}`, 'ai');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCv = async () => {
    addMessage("Generate my CV.", 'user');
    setLoading(true);
    try {
      const cv = await aiService.generateCv();
      addMessage(`Here is your generated CV:\n\n${cv}`, 'ai');
    } catch (e: any) {
      addMessage(`Failed to generate: ${e?.message ?? "Unknown error."}`, 'ai');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    addMessage("Generate a cover letter for me.", 'user');
    setLoading(true);
    try {
      const cl = await aiService.generateCoverLetter();
      addMessage(`Here is your drafted cover letter:\n\n${cl}`, 'ai');
    } catch (e: any) {
      addMessage(`Failed to generate: ${e?.message ?? "Unknown error."}`, 'ai');
    } finally {
      setLoading(false);
    }
  };

  const openDocPicker = async () => {
    setDocPickerVisible(true);
    setLoadingDocs(true);
    try {
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load documents");
    } finally {
      setLoadingDocs(false);
    }
  };

  const openScholarshipPicker = async () => {
    setScholarshipPickerVisible(true);
    setLoadingScholarships(true);
    try {
      const page = await scholarshipService.getScholarships({ size: 100 });
      setScholarships(page.content);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load scholarships");
    } finally {
      setLoadingScholarships(false);
    }
  };

  const handleEligibilitySelect = async (scholarship: Scholarship) => {
    setScholarshipPickerVisible(false);
    addMessage(`Checking eligibility for ${scholarship.name}...`, 'user');
    setLoading(true);
    try {
      const result = await aiService.checkEligibility(scholarship.id);
      const replyText = formatEligibility(scholarship.name, result);
      addMessage(replyText, 'ai');
    } catch (e: any) {
      addMessage(`Failed to check eligibility: ${e?.message ?? "Unknown error."}`, 'ai');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPrompt = () => {
    addMessage("I would like you to review my essay.", 'user');
    setReviewMode(true);
    setTimeout(() => {
      addMessage("Sure! Please paste your essay text below, and I will review it for you.", 'ai', 'review_mode');
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Top App Bar */}
      <ImageBackground
        source={require("../../assets/images/header-assistant.jpg")}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
        imageStyle={{ resizeMode: "cover" }}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, opacity: 0.65 }]} />
        <View style={styles.headerLeft}>

          <Text style={[styles.headerTitle, { color: '#ffffff' }]}>AI Assistant</Text>
        </View>
        <View style={styles.statusBox}>
          <View style={styles.botIconSmall}>
            <Ionicons name="hardware-chip" size={14} color="#1b6d24" />
          </View>
          <Text style={[styles.statusText, { color: '#a0f399' }]}>Online</Text>
        </View>
      </ImageBackground>

      {/* Main Chat Canvas */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.chatCanvas}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[
            styles.messageWrapper,
            msg.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperAi
          ]}>
            {msg.sender === 'ai' && (
              <View style={styles.botAvatar}>
                <Ionicons name="hardware-chip" size={16} color="#1b6d24" />
              </View>
            )}

            <View style={[
              styles.bubble,
              msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi
            ]}>
              <Text style={[
                styles.bubbleText,
                msg.sender === 'user' ? styles.bubbleTextUser : styles.bubbleTextAi
              ]}>{msg.text}</Text>
              <Text style={[
                styles.timeText,
                msg.sender === 'user' ? styles.timeTextUser : styles.timeTextAi
              ]}>{msg.time}</Text>
            </View>

            {msg.sender === 'user' && (
              <UserAvatar size={32} style={styles.userAvatar} />
            )}
          </View>
        ))}

        {loading && (
          <View style={[styles.messageWrapper, styles.messageWrapperAi]}>
            <View style={styles.botAvatar}>
              <Ionicons name="hardware-chip" size={16} color="#1b6d24" />
            </View>
            <View style={[styles.bubble, styles.bubbleAi, { paddingVertical: 12 }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Interaction Area */}
      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom + 90, 100) }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsScroll}>
          <Pressable style={styles.promptBtn} onPress={handleGeneratePs} disabled={loading}>
            <Text style={styles.promptBtnText}>Generate personal statement</Text>
          </Pressable>
          <Pressable style={styles.promptBtn} onPress={handleReviewPrompt} disabled={loading}>
            <Text style={styles.promptBtnText}>Review my essay</Text>
          </Pressable>
          <Pressable style={styles.promptBtn} onPress={handleGenerateCv} disabled={loading}>
            <Text style={styles.promptBtnText}>Generate CV</Text>
          </Pressable>
          <Pressable style={styles.promptBtn} onPress={handleGenerateCoverLetter} disabled={loading}>
            <Text style={styles.promptBtnText}>Generate Cover Letter</Text>
          </Pressable>
          <Pressable style={styles.promptBtn} onPress={openScholarshipPicker} disabled={loading}>
            <Text style={styles.promptBtnText}>Check Eligibility</Text>
          </Pressable>
        </ScrollView>

        <View style={{ flexDirection: 'column' }}>
          {attachedDocument && (
            <View style={styles.attachmentBadge}>
              <Ionicons name="document-text" size={12} color={colors.primary} />
              <Text style={styles.attachmentText} numberOfLines={1}>{attachedDocument.filename}</Text>
              <Pressable onPress={() => setAttachedDocument(null)}>
                <Ionicons name="close-circle" size={16} color={colors.muted} />
              </Pressable>
            </View>
          )}
          <View style={styles.inputContainer}>
            <Pressable style={styles.attachBtn} onPress={openDocPicker}>
              <Ionicons name="attach" size={24} color={colors.muted} />
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder={reviewMode ? "Paste your essay here..." : "Type a message..."}
              placeholderTextColor={colors.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={reviewMode ? 10000 : 1000}
            />
            <Pressable style={styles.sendBtn} onPress={handleSend} disabled={loading || !inputText.trim()}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={18} color="#ffffff" />
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Document Picker Modal */}
      <Modal visible={docPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Document</Text>
              <Pressable onPress={() => setDocPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>
            {loadingDocs ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={documents}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setAttachedDocument(item);
                      setDocPickerVisible(false);
                    }}
                  >
                    <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                    <Text style={styles.pickerItemText}>{item.filename}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No documents found in your vault.</Text>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Scholarship Picker Modal */}
      <Modal visible={scholarshipPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Scholarship</Text>
              <Pressable onPress={() => setScholarshipPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>
            {loadingScholarships ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={scholarships}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => handleEligibilitySelect(item)}
                  >
                    <Ionicons name="school-outline" size={24} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.pickerItemText}>{item.name}</Text>
                      <Text style={styles.pickerItemSubtext} numberOfLines={1}>{item.provider}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No scholarships found.</Text>}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 198, 209, 0.3)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: colors.primary,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a0f399', // secondary-container
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: '#1b6d24', // secondary
  },
  chatCanvas: {
    padding: 20,
    paddingBottom: 20,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    maxWidth: '85%',
  },
  messageWrapperAi: {
    alignSelf: 'flex-start',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a0f399', // secondary-container
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#003366', // primary-container
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  bubbleAi: {
    backgroundColor: '#ffffff', // surface-container-lowest
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.3)',
  },
  bubbleUser: {
    backgroundColor: '#001e40', // primary
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  bubbleTextAi: {
    color: colors.ink, // on-surface
  },
  bubbleTextUser: {
    color: '#ffffff', // on-primary
  },
  timeText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 10,
    marginTop: 8,
  },
  timeTextAi: {
    color: colors.muted, // outline
    opacity: 0.6,
  },
  timeTextUser: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
  },
  bottomArea: {
    backgroundColor: 'rgba(249, 249, 254, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 198, 209, 0.2)',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  promptsScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  promptBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 209, 0.5)',
  },
  promptBtnText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 12,
    color: '#43474f', // on-surface-variant
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8ed', // surface-container-high
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.ink,
    minHeight: 40,
    maxHeight: 100,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#001e40', // primary
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8ed',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  attachmentText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    color: colors.ink,
    maxWidth: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: colors.ink,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 198, 209, 0.3)',
  },
  pickerItemText: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 14,
    color: colors.ink,
  },
  pickerItemSubtext: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
  emptyText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 20,
  },
});
