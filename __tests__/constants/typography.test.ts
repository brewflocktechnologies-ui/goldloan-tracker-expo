import { StyleSheet } from 'react-native';
import { getOrnamentsStyles } from '../../src/components/ornaments/ornamentsStyles';
import { getUsersStyles } from '../../src/components/users/usersStyles';
import { LightColors, Typography } from '../../src/constants/theme';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: require('../../src/constants/theme').LightColors }),
}));

const flat = (style: any) => StyleSheet.flatten(style) as any;

describe('Typography scale', () => {
  it('defines the shared sizes and weights', () => {
    expect(Typography.pageTitle).toEqual({ fontSize: 18, fontWeight: '800' });
    expect(Typography.sectionTitle).toEqual({ fontSize: 15, fontWeight: '800' });
    expect(Typography.cardTitle).toEqual({ fontSize: 14, fontWeight: '800' });
    expect(Typography.body).toEqual({ fontSize: 13, fontWeight: '600' });
    expect(Typography.label).toEqual({ fontSize: 12, fontWeight: '700' });
    expect(Typography.button).toEqual({ fontSize: 15, fontWeight: '800' });
  });

  it.each([[false], [true]])('Users and Ornaments styles use the scale (isDark=%s)', (isDark) => {
    const users: any = getUsersStyles(LightColors, isDark);
    const orn: any = getOrnamentsStyles(LightColors, isDark);

    for (const s of [users, orn]) {
      expect(flat(s.cardTitle)).toMatchObject(Typography.sectionTitle);
      expect(flat(s.inputLabel)).toMatchObject(Typography.label);
    }
    expect(flat(users.submitBtnText)).toMatchObject(Typography.button);
    expect(flat(orn.primaryBtnText)).toMatchObject(Typography.button);
  });

  it('keeps Users and Ornaments form and layout styles identical', () => {
    const users: any = getUsersStyles(LightColors, false);
    const orn: any = getOrnamentsStyles(LightColors, false);

    expect(flat(users.textInput)).toMatchObject({ fontSize: 13, borderRadius: 12 });
    expect(flat(orn.textInput)).toMatchObject({ fontSize: 13, borderRadius: 12 });
    expect(flat(users.cardsScrollContent).paddingBottom).toBe(flat(orn.cardsScrollContent).paddingBottom);
    expect(flat(users.content).paddingBottom).toBe(flat(orn.content).paddingBottom);
    expect(flat(users.emptySubtitle).fontSize).toBe(flat(orn.emptySubtitle).fontSize);
    expect(flat(users.keyValRow).paddingVertical).toBe(flat(orn.tableRow).paddingVertical);
  });
});
