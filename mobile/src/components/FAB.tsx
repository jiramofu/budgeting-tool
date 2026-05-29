import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface FABProps {
  onPress: () => void;
  icon?: string;
}

const FAB: React.FC<FABProps> = ({ onPress, icon = '+' }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.icon}>{icon}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  icon: {
    fontSize: 30,
    color: Colors.textInverse,
    lineHeight: 34,
    textAlign: 'center',
    fontWeight: '300',
  },
});

export default FAB;
