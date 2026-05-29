import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors } from '../../constants/colors';

const SignupScreen: React.FC<any> = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signup } = useAuth();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Required';
    if (!lastName.trim()) e.lastName = 'Required';
    if (!email.trim()) e.email = 'Email is required';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await signup(email.trim(), password, firstName.trim(), lastName.trim());
    } catch (error: any) {
      Alert.alert('Signup Failed', error.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.headline}>Create account</Text>
            <Text style={styles.sub}>Join thousands managing their finances smarter</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Input label="First" value={firstName} onChangeText={setFirstName} placeholder="Jane" editable={!loading} error={errors.firstName} />
              </View>
              <View style={styles.gap} />
              <View style={styles.nameField}>
                <Input label="Last" value={lastName} onChangeText={setLastName} placeholder="Doe" editable={!loading} error={errors.lastName} />
              </View>
            </View>
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!loading} error={errors.email} />
            <Input label="Password" value={password} onChangeText={setPassword} placeholder="Min. 6 characters" secureTextEntry editable={!loading} error={errors.password} />

            <Button label="Create Account" onPress={handleSignup} loading={loading} style={styles.btn} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text style={styles.link} onPress={() => !loading && navigation.navigate('Login')}>
              Sign in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 28 },
  headline: { fontSize: 32, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, lineHeight: 20 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  nameRow: { flexDirection: 'row' },
  nameField: { flex: 1 },
  gap: { width: 12 },
  btn: { marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  link: { fontSize: 14, color: Colors.accent, fontWeight: '700' },
});

export default SignupScreen;
