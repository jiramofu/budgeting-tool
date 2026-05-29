import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface ProgressBarProps {
  value: number;
  height?: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, height = 6, color }) => {
  const clamped = Math.min(Math.max(value, 0), 100);
  const barColor = color ?? (
    clamped <= 75 ? Colors.income :
    clamped <= 90 ? Colors.warning :
    Colors.expense
  );

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, backgroundColor: barColor, height },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#ffffff15',
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: { borderRadius: 99 },
});

export default ProgressBar;
