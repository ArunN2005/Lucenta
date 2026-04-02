import { StyleSheet } from 'react-native';
import colors from './colors';

const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 18,
    padding: 16,
  },
  cardSoft: {
    backgroundColor: colors.bgCardSoft,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 18,
    padding: 16,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default globalStyles;
