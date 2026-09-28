import React from 'react';
import type { SvgProps } from 'react-native-svg';

import { ornamentsIcons, type OrnamentsIconName } from '@/icons/ornaments';
import { userIcons, type UserIconName } from '@/icons/user';

type IconProps = SvgProps & { size?: number };

function renderIcon(IconComponent: React.FC<SvgProps>, { size, width, height, ...rest }: IconProps) {
  return <IconComponent width={width ?? size ?? 24} height={height ?? size ?? 24} {...rest} />;
}

export function OrnamentIcon({ name, ...props }: IconProps & { name: OrnamentsIconName }) {
  return renderIcon(ornamentsIcons[name], props);
}

export function UserIcon({ name, ...props }: IconProps & { name: UserIconName }) {
  return renderIcon(userIcons[name], props);
}
